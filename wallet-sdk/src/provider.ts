import CryptoJS from "crypto-js";
import Wallet from "ethereumjs-wallet";
import { Transaction } from "ethereumjs-tx";
import { bufferToHex, ecsign, hashPersonalMessage, keccak256, toBuffer } from "ethereumjs-util";
import { formatChainId, getFaviconUri, loadStorage, openWindow, parse, parseChainId } from "./utils";
import type { App, Asset, Chain, EIP712Domain, EIP712Message, EIP712Types } from "./types";
import axios from "axios";
import { getChainsByType } from "./chains";
import { CoinmecaWalletBase } from "./core";

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

const __notify = (message?: { icon?: string; title?: string; body?: string; onClick?: Function; onClose?: Function }) => {
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
        // If permission is explicitly denied, do nothing or __notify the user
        console.log("Notification permission is denied. Please enable it in your browser settings.");
    }
};

export interface CoinmecaWalletProviderConfig {
    key?: string;
    address?: string;
    chain?: Chain;
}

export class CoinmecaWalletProvider extends CoinmecaWalletBase {
    #key?: string;

    constructor(config?: CoinmecaWalletProviderConfig) {
        super();

        const data = this.#data();

        const { key, address, chain } = config || {};
        this.#key = key;
        if (address) this.#data()?.get("last:account");
        if (chain) data.set("last:chain", chain);

        localStorage.clear = () => {
            console.error("Attempted to clear localStorage! This action is prevented.");
        };

        (window as any).coinmeca = { wallet: this };
    }

    #safe(fn: Function) {
        const key = this.#key;
        if (key) return fn(key);
        return new Error("Cannot access to the information of accounts.");
    }

    #getKey(key: string) {
        key = CryptoJS.SHA256(`${this.#userId}:${key}`).toString();
        return this.#data({ key }).get(key);
    }

    #data(_?: { key?: string; storage?: CloudStorage | Storage }) {
        const telegram = typeof window !== "undefined" ? (window as any).Telegram?.WebApp : undefined;
        const user = telegram?.initDataUnsafe?.user;
        const isTelegram = !!(telegram && user?.id);
        return loadStorage(this.codename, _?.storage || isTelegram ? telegram?.CloudStorage : localStorage, _?.storage ? false : isTelegram, _?.key);
    }

    #wallet(privateKey: string) {
        return Wallet.fromPrivateKey(Buffer.from(privateKey.toString().trim().substring(0, 64), "hex"));
    }

    #getPrivateKey(index: number | string) {
        if (typeof index === "string") index = this.#storage?.get(index)?.index;
        return this.#safe((key: string) => {
            const wallets = this.#storage?.get(`${key}:accounts`);
            if (wallets && wallets?.length) {
                const key = wallets[index];
                if (key) return key;
                else new Error("Not found account info");
            } else new Error("Wallet is not setup yet.");
        });
    }

    get #userId() {
        return this.#data()?.get("userId");
    }

    get #storage() {
        return this.#safe((key: string) => {
            return this.#data({ key });
        });
    }

    get #session() {
        return this.#safe((key: string) => {
            return this.#data({ key, storage: sessionStorage });
        });
    }

    get isInitialized() {
        return !!this.#userId;
    }

    get isLocked() {
        return !this.#key;
    }

    get isTelegram() {
        return typeof window !== "undefined" && (window as any)?.telegram;
    }

    get address() {
        return this.#data()?.get("last:account");
    }

    get account() {
        return this.#storage?.get?.(this.address?.toLowerCase());
    }

    get accounts() {
        return this.#safe((key: string) => {
            const accounts = this.#storage?.get(`${key}:accounts`);
            if (accounts) return accounts?.map((k: any) => k && this.#storage?.get(this.#wallet(k).getAddressString().toLowerCase())).filter((a: any) => a);
        });
    }

    get chain() {
        const chainId = this.#data()?.get("last:chain");
        return this.chains?.find((c: Chain) => c?.chainId === chainId);
    }

    get chainId() {
        const id = this.#data()?.get("last:chain");
        return id ? formatChainId(id) : undefined;
    }

    get chains() {
        return this.#data().get("chains");
    }

    init(hash: string) {
        if (this.#userId) new Error("Wallet already initialized.");
        const userId = this.isTelegram ? (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user : crypto.randomUUID();
        if (!userId) new Error("Wallet already initialized.");

        this.#data()?.set("userId", userId);
        const key = CryptoJS.SHA256(`${userId}:${hash}`).toString();
        this.#key = key;
        this.#storage?.set(key, key);

        const chains = getChainsByType("mainnet");
        this.#data()?.set("chains", chains);
        this.changeChain(chains[0].chainId);
    }

    lock() {
        this.#data()?.set("last:account", this.account?.address);
        this.#key = undefined;
    }

    check(key: string) {
        const k = this.#getKey(key)?.toLowerCase();
        return k && k === CryptoJS.SHA256(`${this.#userId}:${key}`).toString().toLowerCase();
    }

    unlock(hash: string) {
        const key = this.#getKey(hash);
        if (this.check(hash)) {
            this.#key = key;
            const accounts = this.accounts;

            if (accounts || accounts?.length) {
                const last: any = this.address || this.#storage?.get("last:account") || this.accounts?.[0]?.address;
                const info: any = last && this.#storage?.get(last?.toLowerCase());
                if (info) {
                    this.emit("unlock", info);
                    return info;
                }
            } else throw new Error("Not found account info.");
        } else throw new Error("Invalid key entered.");
    }

    create() {
        return this.#safe((key: string) => {
            const accounts = this.accounts || [];
            const index = accounts?.length;

            const seed = CryptoJS.SHA256(`${key}:${index}`).toString();
            const address = this.#wallet(seed)?.getAddressString();

            if (address) {
                if (!this.#storage?.get(address?.toLowerCase())) {
                    this.#storage?.set(address?.toLowerCase(), { address, index, name: `Wallet ${index + 1}` });
                    this.#storage?.set(`${key}:accounts`, [...(this.#storage?.get(`${key}:accounts`) || []), seed]);
                }
                this.changeAccount(index);
                return true;
            } else return false;
        });
    }

    import(privateKey: string) {
        return this.#safe((key: string) => {
            const accounts = this.accounts || [];
            const index = accounts?.length;

            const address = this.#wallet(privateKey).getAddressString();
            if (address) {
                if (!this.#storage?.get(address?.toLowerCase())) {
                    this.#storage?.set(address?.toLowerCase(), { address, index, name: `Wallet ${index + 1}` });
                    this.#storage?.set(`${key}:accounts`, [...(this.#storage?.get(`${key}:accounts`) || []), privateKey]);
                }
                this.changeAccount(index);
                return true;
            } else return false;
        });
    }

    change(key: string, newHash: string) {
        const old = CryptoJS.SHA256(`${this.#userId}:${key}`).toString();
        this.#data({ key }).set(CryptoJS.SHA256(`${this.#userId}:${newHash}`).toString(), this.#getKey(key));
        this.#data({ key }).remove(old);
    }

    changeAccount(index: number) {
        return this.#safe(() => {
            const account = this.accounts?.[index];
            if (!account) throw new Error("There is no accounts that setup yet.");
            this.#data().set("last:account", account?.address);
            this.emit("accountChanged", account?.address);
            return account?.address;
        });
    }

    changeChain(chainId: number | string) {
        chainId = (typeof chainId === "string" ? (chainId?.startsWith("0x") ? parseChainId(chainId) : parseInt(chainId)) : chainId) as number;
        const chains = this.chains;
        console.log({ chain: chains?.find((c: Chain) => c?.chainId === chainId) });
        if (chains?.length && chains?.find((c: Chain) => c?.chainId === chainId)) {
            if (typeof window !== "undefined") (window as any).ethereum = { chainId };
            this.#data().set("last:chain", chainId);
            this.emit("chainChanged", formatChainId(chainId));
            return chainId;
        } else throw new Error("There is no any chain registered.");
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

    async request({ method, params }: { method: string; params?: any[] }) {
        switch (method) {
            // Account Management
            case "eth_accounts":
                return [this.address];

            case "eth_requestAccounts":
                // return await this.#requestAccounts();
                return;

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
                    if (result) this.switchEthereumChain(result);
                    // else await this.#addEthereumChain(result);
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
                            await this.switchEthereumChain(result);
                            return result;
                        });
                }
                throw new Error("No chain information registered yet.");

            case "wallet_watchAsset":
                if (!params || !params?.length) throw new Error("No asset parameters provided");
                return await this.#watchAsset(params[0]);

            // Custom or Unsupported Methods
            default:
                throw new Error(`Method '${method}' not supported`);
        }
    }

    async #app() {
        return {
            appName: (document.querySelector('meta[property="og:site_name"]') as HTMLMetaElement)?.content || document.title?.split(" ")[0],
            appUrl: window.location.host,
            appLogo: await getFaviconUri(),
        };
    }

    async #estimateGas(txParams: any) {
        return await this.#sendRpcRequest("eth_estimateGas", [txParams]);
    }

    async #getGasPrice() {
        return await this.#sendRpcRequest("eth_gasPrice");
    }

    async #signMessage(address: string, message: string) {
        return this.#safe(() => {
            if (address.toLowerCase() !== this.address.toLowerCase()) throw new Error("Address does not match selected wallet address");
            const buffer = toBuffer(message);
            const hash = hashPersonalMessage(buffer);
            const signature = ecsign(hash, this.#getPrivateKey(address));
            return bufferToHex(Buffer.concat([signature.r, signature.s, Buffer.from([signature.v])]));
        });
    }

    async #signPersonalMessage(message: string, address: string) {
        return await this.#signMessage(address, message);
    }

    async #signTypedData(address: string, typedData: EIP712Message) {
        if (!this.#wallet || !this.address) throw new Error("Account doesn't setup yet.");
        if (address.toLowerCase() !== this.address.toLowerCase()) throw new Error("Address does not match selected wallet address");

        const domain = this.#hashDomain(typedData.domain);
        const message = this.#hashStruct(typedData.primaryType, typedData.message, typedData.types);
        const data = keccak256(Buffer.concat([toBuffer("0x1901"), domain, message]));
        const signature = ecsign(data, this.#getPrivateKey(address));
        return bufferToHex(Buffer.concat([signature.r, signature.s, Buffer.from([signature.v])]));
    }

    async #signTransaction(txParams: any) {
        const app = this.#storage?.get(`app:${window.location.host}`);
        if (app) {
            const from = txParams?.from?.toLowerCase();
            const exist = app?.address?.find((a: string) => a?.toLowerCase() === from);
            if (exist) {
                const account = this.#storage?.get(from);
                if (!account) throw new Error("Account information is something wrong.");

                const method = "eth_signTransaction";
                return await __promise(method, this.#confirm(method), [txParams, await this.#app()]).then(async (result: any) => {
                    if (result) {
                        const tx = new Transaction(txParams);
                        tx.sign((this.#storage?.get(`${this.#session?.get("key")}:accounts`))[exist.index]);
                        return `0x${tx.serialize().toString("hex")}`;
                    }
                });
            } else throw new Error("Account doesn't approved this app.");
        }
        throw new Error("Account have to be connected to the app first.");
    }

    async #sendTransaction(txParams: any) {
        const app = this.#storage?.get(`app:${window.location.host}`);
        if (app) {
            const from = txParams?.from?.toLowerCase();
            const exist = app?.address?.find((a: string) => a?.toLowerCase() === from);
            if (exist) {
                const account = this.#storage?.get(from);
                if (!account) throw new Error("Account information is something wrong.");

                const method = "eth_sendTransaction";
                return await __promise(method, this.#confirm(method), [txParams, await this.#app()]).then(async (result: any) => {
                    if (result) {
                        __notify();
                        const tx = new Transaction(txParams);
                        tx.sign(Buffer.from(result?.substring(0, 64), "hex"));
                        return await this.#broadcastTransaction(result);
                    }
                });
            } else throw new Error("Account doesn't approved this app.");
        }
        throw new Error("Account have to be connected to the app first.");
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
        if (!rpc) throw new Error("Provider URL was not setup yet.");
        const response = await axios.post(rpc, {
            jsonrpc: "2.0",
            id: new Date().getTime(),
            method,
            params,
        });

        if (response.data.error) throw new Error(`RPC Error: ${response.data.error.message}`);
        return response.data.result;
    }

    async addEthereumChain(chain: Chain) {
        const { chainId, rpcUrls, nativeCurrency, base } = chain;
        if (base !== "evm") throw new Error("Chain base doesn't EVM based.");
        if (!chainId || !rpcUrls || !rpcUrls.length || !nativeCurrency.decimals)
            throw new Error("Invalid chain parameters. `chainId` and at least one `rpcUrls` are required.");

        const chains: Chain[] = this.#data()?.get("chains") || [];
        const exist = chains?.find((c) => c?.chainId === chain.chainId);
        this.#data()?.set("chains", [{ ...exist, ...chain }, ...chains?.filter((c: Chain) => c?.chainId !== chainId)]);
        return true;
    }

    async switchEthereumChain(chainId: number | string) {
        chainId = (typeof chainId === "string" ? (chainId?.startsWith("0x") ? parseChainId(chainId) : parseInt(chainId)) : chainId) as number;
        const chains = this.#data()?.get("chains") || [];
        if (chains?.find((c: Chain) => c?.chainId === chainId)) return this.changeChain(chainId);
    }

    async requestAccounts(app: App, address?: string) {
        address = address || this.address;
        if (address) {
            const apps: App[] = this.#data().get("apps") || [];
            if (app?.url) {
                const exist: App = { ...apps?.find((a: App) => a?.url?.toLowerCase() === app?.url?.toLowerCase()), ...app };
                const accounts = [address, ...(exist?.accounts || [])?.filter((a) => a?.toLowerCase() !== address?.toLowerCase())].filter((a) => a);
                app = {
                    ...exist,
                    accounts,
                };
                this.#data().set("apps", [app, ...apps?.filter((a) => a?.url?.toLowerCase() !== app?.url?.toLowerCase())]);
                return accounts;
            } else throw new Error("Invalid app information.");
        } else throw new Error("Couldn't found a current account information.");
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
        ).filter((url?: string) => url?.startsWith("http"));

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
}
