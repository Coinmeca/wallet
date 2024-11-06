import CryptoJS from "crypto-js";
import EventEmitter from "eventemitter3";
import Wallet from "ethereumjs-wallet";
import { Transaction } from "ethereumjs-tx";
import { bufferToHex, ecsign, hashPersonalMessage, keccak256, toBuffer } from "ethereumjs-util";
import { decrypt, encrypt, format, formatChainId, getFaviconUri, loadStorage, openWindow, parse } from "utils";
import axios from "axios";
import { Account } from "types";

export type ChainBase = "evm" | "svm";
export type ChainType = "mainnet" | "mainnet-beta" | "testnet" | "devnet";

export interface Chain {
    base?: ChainBase;
    type?: ChainType;
    chainName?: string;
    chainId: number | string;
    nativeCurrency: NativeCurrency;
    rpcUrls: string[];
    blockExplorerUrls?: string[];
    iconUrls?: string[];
}

export interface RequestParams {
    method: string;
    params?: any[];
}

export interface TransactionParams {
    from: string;
    to: string;
    value: string;
    gas: string;
    gasPrice: string;
    data?: string;
}

export interface EIP712Domain {
    name?: string;
    version?: string;
    chainId?: number;
    verifyingContract?: string;
    salt?: string;
}

export interface EIP712Types {
    [key: string]: { name: string; type: string }[];
}

export interface EIP712Message {
    types: EIP712Types;
    domain: EIP712Domain;
    primaryType: string;
    message: any;
}

export interface NativeCurrency {
    name: string;
    symbol: string;
    decimals: number;
}

export type ERC20Options = {
    address: string;
    symbol?: string;
    decimals?: number;
    image?: string;
};

export type ERC721Options = {
    address: string;
    symbol?: string;
    decimals?: number;
    image?: string;
    tokenId?: string;
};

export type ERC1155Options = {
    address: string;
    symbol?: string;
    decimals?: number;
    image?: string;
    tokenId?: string;
};

export type AssetOptions<Name> = Name extends "ERC20" ? ERC20Options : Name extends "ERC721" ? ERC721Options : Name extends "ERC1155" ? ERC1155Options : never;

export interface Asset<Name extends "ERC20" | "ERC721" | "ERC1155"> {
    type: Name;
    options: AssetOptions<Name>;
}

// Create a custom Axios instance
const axiosQuiet = axios.create({
    timeout: 5000,
});

// Suppress logging of errors
axiosQuiet.interceptors.response.use(
    (response) => response,
    (error) => {
        // Return a resolved promise for errors to avoid logging
        return Promise.resolve({ error });
    },
);

export interface CoinmecaWalletProviderConfig {
    privateKey?: string;
    chain?: Chain;
}



const __promise = async (method: string, popup: any, params?: any) => {
    return new Promise((resolve, reject) => {
        const messageHandler = (event: any) => {
            if (event.data.method === method) {
                if (event.data.result) resolve(event.data.result);
                else {
                    if (event.data.error) reject(new Error(event.data.error));
                    else reject(new Error("Request something wrong."));
                }
                window.removeEventListener("message", messageHandler);
            }

            if (event.data.close) {
                reject(new Error(event.data.error));
                window.removeEventListener("message", messageHandler);
            }
        };
        window.addEventListener("message", messageHandler);

        console.log("beforeload", popup);
        if (popup) {
            const onLoad = (e: any) => {
                console.log({ e, popup });
                if (popup?.coinmeca) popup.coinmeca = { ...popup.coinmeca, method, params };
                else popup.coinmeca = { method, params };
            };
            if (params) popup.addEventListener("load", onLoad);

            const onClose = setInterval(() => {
                if (popup.closed) {
                    clearInterval(onClose);
                    reject(new Error("User closed the window before approving the request."));
                    window.removeEventListener("message", messageHandler);
                    if (params) window.removeEventListener("load", onLoad);
                }
            }, 100); // Check every 100ms
        }
    });
};


function notify(message?: { icon?: string; title?: string; body?: string; onClick?: Function; onClose?: Function }) {
    function push() {
        const notification = new Notification("Hello!", {
            body: "This is a notification from your browser.",
            icon: "icon.png", // Optional: URL of an icon to display in the notification
        });

        // Optional: add event listeners
        notification.onclick = () => {
            console.log("Notification clicked!");
            window.focus();
        };

        notification.onclose = () => {
            console.log("Notification closed!");
        };
    }
    // Check if notification permission has been granted
    if (Notification.permission === "granted") {
        // Permission is already granted, send the notification directly
        push();
    } else if (Notification.permission !== "denied") {
        // Permission has not been granted yet, request permission
        Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
                // Permission was granted, send the notification
                push();
            } else {
                console.log("Notification permission denied.");
            }
        });
    } else {
        // If permission is explicitly denied, do nothing or notify the user
        console.log("Notification permission is denied. Please enable it in your browser settings.");
    }
}

export class CoinmecaWalletProvider {
    #codename = "coinmeca:wallet";
    #__data?: string;

    private events: EventEmitter;

    public address: string;
    public isCoinmecaWallet = true;

    constructor(config?: CoinmecaWalletProviderConfig) {
        const data = this.#load();

        const { chain } = config || {};
        if (chain) data.set("last:chain", chain);

        this.address = this.#load()?.get("last:account")
        this.events = new EventEmitter();


        localStorage.clear = () => {
            console.error("Attempted to clear localStorage! This action is prevented.");
        };
        return this.#proxy();
    }

    #proxy() {
        const handler = {
            get: (target: any, prop: string) => {
                if (typeof target[prop] === "function") return (...args: any[]) => target[prop](...args);
                return target[prop];
            },
        };

        return new Proxy(this, handler);
    }

    #key?: string;

    #safe(fn: Function) {
        const key = this.#key;
        if (key) return fn(key);
        return new Error("Cannot access to the information of accounts.")
    }

    #hash?: string;
    #data?: { [x: string]: any };

    get #store() {
        return this.#safe((salt: string) => {
            return {
                set: (key: string, value: any) => this.#data = {
                    ...this.#data,
                    [`${encrypt(format(key)), salt}`]: encrypt(format(value), salt),
                },
                get: (key: string) => parse(decrypt(this.#data?.[`${encrypt(format(key), salt)}`], salt))
            }
        })
    }

    /*
    {
        wallet: storage
    }
    */

    get #userId() {
        this.#key = ""
        const userId = CryptoJS.SHA256((window as any)?.Telegram?.WebApp?.initDataUnsafe?.user).toString() || this.#store?.get(`${this.#codename}:userId`);
        this.#key = undefined;
        return userId;
    }

    unlock(hashKey: string) {
        this.#data = parse(decrypt(this.#__data, this.#userId))
        const data = this.#store?.get(CryptoJS.SHA256(`${this.#userId}:${hashKey}`).toString());
        if (key === CryptoJS.SHA256(key).toString()) {
            this.#key = key;
            const accounts = this.accounts;

            if (!accounts || !accounts?.length) this.#load()?.remove("init");
            else {
                const last: any = this.address || this.#storage?.get("last:account") || this.accounts?.[0] ? this.#wallet(this.accounts?.[0])?.getAddressString() : undefined;
                const info: any = this.#storage?.get(last?.toLowerCase());
                if (info) return info;
            }
        } else new Error("Invalid key entered.")
    }


    #load(_?: { key?: string; storage?: CloudStorage | Storage; }) {
        const telegram = typeof window !== "undefined" ? (window as any).Telegram?.WebApp : undefined;
        const user = telegram?.initDataUnsafe?.user;
        const isTelegram = !!(telegram && user?.id);
        return loadStorage(
            this.#codename,
            _?.storage || isTelegram ? telegram?.CloudStorage : localStorage,
            _?.storage ? false : isTelegram,
            _?.key,
        );
    };

    #wallet(privateKey: string) {
        return Wallet.fromPrivateKey(Buffer.from(privateKey?.substring(0, 64), "hex"));
    }

    get #storage() {
        return this.#safe((key: string) => {
            return this.#load({ key })
        })
    };

    get #session() {
        return this.#safe((key: string) => {
            return this.#load({ key, storage: sessionStorage })
        })
    };

    get #account() {
        return this.#safe((key: string) => {
            return this.#storage?.get("last:account")
        })
    }

    changeAccount(index: number): void {
        return this.#safe((key: string) => {
            const wallets = this.#storage?.get(`${key}:wallets`);
            if (wallets && wallets?.length) {
                if (wallets?.[index]) {
                    return wallets?.[index]
                } else return new Error("There is no accounts that setup yet.")
            } else return new Error("There is no accounts that setup yet.")
        })
    }

    get isInitialized() {
        return !!this.#load()?.get("init");
    }

    get isLocked() {
        return !!this.#key;
    }

    get isTelegram() {
        return typeof window !== "undefined" && (window as any)?.telegram;
    }

    get accounts() {
        return this.#safe((key: string) => {
            const wallets = this.#storage?.get(`${key}:wallets`);
            if (wallets && wallets?.length) return wallets?.map((k: string) => this.#storage?.get(this.#wallet(k)?.getAddressString()?.toLowerCase()));
            else return new Error("There is no accounts that setup yet.")
        })
    }

    get chain() {
        return this.#load()?.get("last:chain");
    }

    get chainId() {
        return this.chain?.chainId ? formatChainId(this.chain.chainId) : undefined;
    }

    changeChain(chain: Chain): void {
        const chainId = formatChainId(chain.chainId);
        if (this.chainId !== chainId) {
            if (window) window.ethereum.chainId = chainId;
            this.emit("chainChanged", chainId);
        }
    }

    async request({ method, params }: { method: string; params?: any[] }) {
        switch (method) {
            // Account Management
            case "eth_accounts":
                return [this.address];

            case "eth_requestAccounts":
                return await this.#requestAccounts();

            case "eth_coinbase":
                return this.address;

            // Chain and Network
            case "eth_chainId":
                return this.chainId;

            case "net_version":
                return this.chainId?.toString();

            // Transaction and Gas Estimation
            case "eth_sendTransaction":
                if (!params || !params?.length) throw new Error("No transaction parameters provided");
                return this.#sendTransaction(params[0]);

            case "eth_estimateGas":
                if (!params || !params?.length) throw new Error("No transaction parameters provided");
                return await this.#estimateGas(params[0]);

            case "eth_gasPrice":
                return await this.#getGasPrice();

            // Signing Methods
            case "eth_sign":
                if (!params || params.length < 2) throw new Error("eth_sign requires address and message");
                return await this.#signMessage(params[0], params[1]);

            case "eth_signTypedData_v4":
                if (!params || params.length < 2) throw new Error("eth_signTypedData_v4 requires address and typed data");
                return await this.#signTypedData(params[0], params[1]);

            case "personal_sign":
                if (!params || params.length < 2) throw new Error("personal_sign requires message and address");
                return await this.#signPersonalMessage(params[0], params[1]);

            case "eth_signTransaction":
                if (!params || !params?.length) throw new Error("No transaction parameters provided");
                return await this.#signTransaction(params[0]);

            // Event Subscription
            case "eth_subscribe":
            case "eth_unsubscribe":
                throw new Error(`${method} is not supported. Subscription methods are not available in this wallet`);

            // Block and State Queries
            case "eth_blockNumber":
                console.log("request");
                return await this.#getBlockNumber();

            case "eth_getBalance":
                if (!params || !params?.length) throw new Error("eth_getBalance requires an address");
                return await this.#getBalance(params[0]);

            case "eth_getTransactionCount":
                if (!params || !params?.length) throw new Error("eth_getTransactionCount requires an address");
                return await this.#getTransactionCount(params[0]);

            case "eth_getCode":
                if (!params || !params?.length) throw new Error("eth_getCode requires an address");
                return await this.#getCode(params[0]);

            case "wallet_addEthereumChain":
                const chain = params && (Array.isArray(params) ? params[0] : params);
                if (!chain) throw new Error("No chain parameters provided");
                return await __promise(method, this.#confirm(method), chain).then(async (result: any) => {
                    if (result) this.#switchEthereumChain(result);
                    else await this.#addEthereumChain(result);
                    return result;
                });
            case "wallet_switchEthereumChain":
                const data = params && (Array.isArray(params) ? params[0] : params);
                if (!data) throw new Error("No chain parameters provided");
                const chains = this.#storage?.get(`${this.#session?.get("key")}:chains`);
                if (chains) {
                    const exist = chains?.find(
                        (c: any) =>
                            (c?.chainId || c?.id) && typeof data?.chainId === "string" && formatChainId(c?.chainId || c?.id) === data?.chainId?.toLowerCase(),
                    );
                    if (exist)
                        return await __promise(method, this.#confirm(method), data).then(async (result: any) => {
                            await this.#switchEthereumChain(result);
                            return result;
                        });
                }
                return new Error("No chain information registered yet.");

            case "wallet_watchAsset":
                if (!params || !params?.length) throw new Error("No asset parameters provided");
                return await this.#watchAsset(params[0]);

            // Custom or Unsupported Methods
            default:
                throw new Error(`Method '${method}' not supported`);
        }
    }

    #confirm(method: string) {
        // window.location.href = `${window.location.origin}/request/${method}`;
        // return window;
        if (window.location.hostname?.includes("wallet.coinmeca.net")) {
            window.location.href = `${window.location.origin}/request/${method}`;
            return window;
        } else return openWindow(`${window.location.origin}/request/${method}`);
    }

    #hashDomain(domain: EIP712Domain) {
        return this.#hashStruct("EIP712Domain", domain, {
            EIP712Domain: [
                { name: "name", type: "string" },
                { name: "version", type: "string" },
                { name: "chainId", type: "uint256" },
                { name: "verifyingContract", type: "address" },
                { name: "salt", type: "bytes32" },
            ],
        });
    }

    #encodeType(primaryType: string, types: EIP712Types) {
        let result = `${primaryType}(${types[primaryType].map(({ name, type }) => `${type} ${name}`).join(",")})`;
        const uniqueTypes = new Set<string>();

        for (const field of types[primaryType] || []) {
            if (!uniqueTypes.has(field.type) && types[field.type]) {
                uniqueTypes.add(field.type);
                result += this.#encodeType(field.type, types);
            }
        }
        return result;
    }

    #typeHash(primaryType: string, types: EIP712Types) {
        return keccak256(Buffer.from(this.#encodeType(primaryType, types)));
    }

    #encodeData(type: string, data: any, types: EIP712Types) {
        const encodedTypes = ["bytes32"];
        const encodedValues = [this.#typeHash(type, types)];

        for (const field of types[type]) {
            const value = data[field.name];
            if (types[field.type]) {
                encodedTypes.push("bytes32");
                encodedValues.push(this.#hashStruct(field.type, value, types));
            } else if (field.type === "string" || field.type === "bytes") {
                encodedTypes.push("bytes32");
                encodedValues.push(keccak256(Buffer.from(value)));
            } else {
                encodedTypes.push(field.type);
                encodedValues.push(value);
            }
        }
        return Buffer.concat(encodedValues.map((v) => toBuffer(v)));
    }

    #hashStruct(primaryType: string, data: any, types: EIP712Types) {
        return keccak256(this.#encodeData(primaryType, data, types));
    }

    async #app() {
        return {
            appName: (document.querySelector('meta[property="og:site_name"]') as HTMLMetaElement)?.content || document.title?.split(" ")[0],
            appUrl: window.location.host,
            appLogo: await getFaviconUri(),
        };
    }

    async #requestAccounts() {
        const method = "eth_requestAccounts";
        return await __promise(method, this.#confirm(method), await this.#app()).then((result) => result);
    }

    async #estimateGas(txParams: any) {
        return await this.#sendRpcRequest("eth_estimateGas", [txParams]);
    }

    async #getGasPrice() {
        return await this.#sendRpcRequest("eth_gasPrice");
    }

    async #signMessage(address: string, message: string) {
        if (!this.#wallet || !this.address) return new Error("Account doesn't setup yet.");
        if (address.toLowerCase() !== this.address.toLowerCase()) throw new Error("Address does not match selected wallet address");
        const buffer = toBuffer(message);
        const hash = hashPersonalMessage(buffer);
        const signature = ecsign(hash, this.#wallet.getPrivateKey());
        return bufferToHex(Buffer.concat([signature.r, signature.s, Buffer.from([signature.v])]));
    }

    async #signPersonalMessage(message: string, address: string) {
        return await this.#signMessage(address, message);
    }

    async #signTypedData(address: string, typedData: EIP712Message) {
        if (!this.#wallet || !this.address) return new Error("Account doesn't setup yet.");
        if (address.toLowerCase() !== this.address.toLowerCase()) throw new Error("Address does not match selected wallet address");

        const domain = this.#hashDomain(typedData.domain);
        const message = this.#hashStruct(typedData.primaryType, typedData.message, typedData.types);
        const data = keccak256(Buffer.concat([toBuffer("0x1901"), domain, message]));
        const signature = ecsign(data, this.#wallet.getPrivateKey());
        return bufferToHex(Buffer.concat([signature.r, signature.s, Buffer.from([signature.v])]));
    }

    async #signTransaction(txParams: any) {
        const app = this.#storage?.get(`app:${window.location.host}`);
        if (app) {
            const from = txParams?.from?.toLowerCase();
            const exist = app?.address?.find((a: string) => a?.toLowerCase() === from);
            if (exist) {
                const account = this.#storage?.get(from);
                if (!account) return new Error("Account information is something wrong.");

                const method = "eth_signTransaction";
                return await __promise(method, this.#confirm(method), [txParams, await this.#app()]).then(async (result: any) => {
                    if (result) {
                        const tx = new Transaction(txParams);
                        tx.sign((this.#storage?.get(`${this.#session?.get("key")}:wallets`))[exist.index]);
                        return `0x${tx.serialize().toString("hex")}`;
                    }
                });
            } else return new Error("Account doesn't approved this app.");
        }
        return new Error("Account have to be connected to the app first.");
    }

    async #sendTransaction(txParams: any) {
        const app = this.#storage?.get(`app:${window.location.host}`);
        if (app) {
            const from = txParams?.from?.toLowerCase();
            const exist = app?.address?.find((a: string) => a?.toLowerCase() === from);
            if (exist) {
                const account = this.#storage?.get(from);
                if (!account) return new Error("Account information is something wrong.");

                const method = "eth_sendTransaction";
                return await __promise(method, this.#confirm(method), [txParams, await this.#app()]).then(async (result: any) => {
                    if (result) {
                        notify();
                        const tx = new Transaction(txParams);
                        tx.sign(Buffer.from(result?.substring(0, 64), "hex"));
                        return await this.#broadcastTransaction(result);
                    }
                });
            } else return new Error("Account doesn't approved this app.");
        }
        return new Error("Account have to be connected to the app first.");
    }

    async #getBlockNumber() {
        console.log("getBlockNumber");
        return await this.#sendRpcRequest("eth_blockNumber");
    }

    async #getBalance(address: string) {
        return await this.#sendRpcRequest("eth_getBalance", [address, "latest"]);
    }

    async #getTransactionCount(address: string) {
        return await this.#sendRpcRequest("eth_getTransactionCount", [address, "latest"]);
    }

    async #getCode(address: string) {
        return await this.#sendRpcRequest("eth_getCode", [address, "latest"]);
    }

    async #broadcastTransaction(serializedTx: Buffer) {
        return await this.#sendRpcRequest("eth_sendRawTransaction", [`0x${serializedTx.toString("hex")}`]);
    }

    async #sendRpcRequest(method: string, params: any[] = []) {
        console.log("sendRpcRequest");
        const rpc = await this.#rpcUrl();
        console.log({ rpc });
        if (!rpc) return new Error("Provider URL was not setup yet.");
        const response = await axios.post(rpc, {
            jsonrpc: "2.0",
            id: new Date().getTime(),
            method,
            params,
        });

        if (response.data.error) throw new Error(`RPC Error: ${response.data.error.message}`);
        return response.data.result;
    }

    async #addEthereumChain(chain: Chain) {
        // Check for required chain parameters
        const { chainId, chainName, rpcUrls, nativeCurrency } = chain;
        if (!chainId || !rpcUrls || rpcUrls.length === 0 || !nativeCurrency.decimals)
            throw new Error("Invalid chain parameters. `chainId` and at least one `rpcUrl` are required.");

        // fixme:

        return { message: `Chain ${chainName} with chainId ${chainId} added successfully.` };
    }

    async #switchEthereumChain(chain: Chain) {
        // Check for required chain parameters
        const { chainId, chainName, rpcUrls, nativeCurrency } = chain;
        if (!chainId || !rpcUrls || rpcUrls.length === 0 || !nativeCurrency.decimals)
            throw new Error("Invalid chain parameters. `chainId` and at least one `rpcUrl` are required.");

        this.changeChain(chain);
        return { message: `Chain ${chainName} with chainId ${chainId} added successfully.` };
    }

    async #watchAsset(asset: Asset<"ERC20" | "ERC721" | "ERC1155">) {
        const { type, options } = asset;
        if (type !== "ERC20") throw new Error("Unsupported asset type. Only ERC20 tokens are supported.");

        const { address, symbol, decimals, image } = options;
        if (!address || !symbol || decimals === undefined) throw new Error("Invalid asset options. `address`, `symbol`, and `decimals` are required.");

        this.emit("assetAdded", {
            address,
            symbol,
            decimals,
            image: image || null,
        });

        return { success: true, message: `Asset ${symbol} at ${address} added to watch list.` };
    }

    async #rpcUrl() {
        const urls = (
            typeof this.chain?.rpcUrls === "object" ? Object.values(this.chain.rpcUrls) : Array.isArray(this.chain?.rpcUrls) ? this.chain.rpcUrls : []
        ).filter((url) => url?.startsWith("http"));

        if (urls.length === 0) return null;
        const availableUrls = await Promise.all(
            urls.map(async (url: string) => {
                const start = Date.now();
                try {
                    await axiosQuiet.get(url); // Making the request
                    const elapsed = Date.now() - start;

                    // If the request is successful, return the URL and its latency
                    return { url, latency: elapsed };
                } catch {
                    // Return an object indicating failure without logging errors
                    return { url, latency: Number.MAX_SAFE_INTEGER };
                }
            }),
        );

        // Filter out URLs that resulted in an error
        const workingUrls = availableUrls.filter((result) => !!result && result.latency !== Number.MAX_SAFE_INTEGER).sort((a, b) => a.latency - b.latency);
        return workingUrls.length ? workingUrls[0].url : null;
    }

    async getAddress() {
        return this.address;
    }

    async balance() {
        if (this.address) return await this.#sendRpcRequest("eth_getBalance", [this.address, "latest"]);
        else return 0;
    }

    // Event handling with EventEmitter3
    on(event: string, listener: (...args: any[]) => void, context?: any): this {
        this.events.on(event, listener);
        return this;
    }

    off(event: string, listener: (...args: any[]) => void, context?: any): this {
        this.events.off(event, listener);
        return this;
    }

    emit(event: string, ...args: any[]): void {
        this.events.emit(event, ...args);
    }
}
