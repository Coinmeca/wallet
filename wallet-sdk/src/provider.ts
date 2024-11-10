import CryptoJS from "crypto-js";
import Wallet from "ethereumjs-wallet";
import { Transaction } from "ethereumjs-tx";
import { bufferToHex, ecsign, hashPersonalMessage, keccak256, toBuffer } from "ethereumjs-util";
import { formatChainId, getFaviconUri, loadStorage, openWindow, parse, parseChainId } from "./utils";
import type { Account, App, Asset, Chain, EIP712Domain, EIP712Message, EIP712Types, TransactionParams } from "./types";
import axios from "axios";
import { getChainsByType } from "./chains";
import { CoinmecaWalletBase } from "./core";

const __promise = async (method: string, popup: any, params?: any) => {
    return new Promise((resolve, reject) => {
        const messageHandler = (event: any) => {
            if (event.data.method === method) {
                if (typeof event.data.result !== "undefined") resolve(event.data.result);
                if (typeof event.data.error !== "undefined") reject(new Error(event.data.error));
                // else reject(new Error("Request something wrong."));

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
    chainId?: number;
}

export class CoinmecaWalletProvider extends CoinmecaWalletBase {
    #key?: string;

    constructor(config?: CoinmecaWalletProviderConfig) {
        super();

        const { key, address, chainId } = config || {};
        this.#key = key;

        const data = this.#data();
        if (address) data?.set("account", address);
        if (chainId && data?.get("chains")?.some((c: Chain) => c?.chainId === chainId)) this.changeChain(chainId);

        localStorage.clear = () => {
            console.error("Attempted to clear localStorage! This action is prevented.");
        };
        Object.freeze(loadStorage);
        (window as any).coinmeca = { wallet: this };
    }

    #safe(fn: Function) {
        if (this.#key) return fn(this.#key);
        if (!this.isInitialized) return new Error("Cannot access to the information of accounts.");
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
        if (typeof index === "string") index = this.#storage?.get(index?.toLowerCase())?.index;
        return this.#safe((key: string) => {
            const wallets = this.#storage?.get(`${key}:seed`);
            if (wallets?.length) {
                const key = wallets[index];
                if (key) return key;
                else throw new Error("Not found account info");
            } else throw new Error("Wallet is not setup yet.");
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

    get isInitialized(): boolean {
        return !!this.#userId;
    }

    get isLocked(): boolean {
        return !this.#key;
    }

    get isTelegram(): boolean {
        return typeof window !== "undefined" && (window as any)?.telegram;
    }

    get address(): string {
        return this.#data()?.get("account");
    }

    account(address?: string): Account {
        return this.#storage?.get?.((address || this.address)?.toLowerCase());
    }

    accounts(url?: string): (string | Account)[] {
        try {
            return (
                (url && url !== ""
                    ? this.#data()?.get('apps')?.find((a: App) => a?.url?.toLowerCase() === url?.toLowerCase())?.accounts
                    : this.#safe((key: string) => this.#storage?.get(`${key}:seed`)?.map((s: string) => this.#wallet(s)?.getAddressString()))?.map((a: string) => this.#storage?.get(a?.toLowerCase()))
                ) || []
            ).filter((a: any) => a);
        } catch (e) {
            return []
        }
    }

    allowance(url: string, address?: string) {
        address = address || this.address;
        return !!url && url !== "" && !!address && address !== "" && (this.accounts(url) as string[])?.some(a => a?.toLowerCase() === address?.toLowerCase())
    }

    get chain() {
        const chainId = this.#data()?.get("chain");
        return this.chains?.find((c: Chain) => c?.chainId === chainId);
    }

    get chainId() {
        const id = this.#data()?.get("chain");
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
        this.#data()?.set("account", this.account()?.address);
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
            const accounts = this.accounts();

            if (accounts?.length) {
                const last: any = this.address || this.#storage?.get("account") || (this.accounts()?.[0] as Account)?.address;
                const info: any = last && this.#storage?.get(last?.toLowerCase());
                if (info) {
                    this.emit("unlock", info);
                    return info;
                }
            }
        } else throw new Error("Invalid key entered.");
    }

    create() {
        return this.#safe((key: string) => {
            const keys = this.#storage?.get(`${key}:seed`) || [];
            const index = keys?.length;

            const seed = CryptoJS.SHA256(`${key}:${index}`).toString();
            const address = this.#wallet(seed)?.getAddressString();

            if (address) {
                if (!keys?.some((s: string, i: number) => s?.toLowerCase() === seed?.toLowerCase())) this.#storage?.set(`${key}:seed`, [...keys, seed]);
                if (!this.#data()?.get(address?.toLowerCase())) this.#storage?.set(address?.toLowerCase(), { address, index, name: `Wallet ${index + 1}` });
                this.changeAccount(index);
                return true;
            } else return false;
        });
    }

    import(privateKey: string) {
        return this.#safe((key: string) => {
            const keys = this.#storage?.set(`${key}:seed`) || [];
            const accounts = this.#data()?.get("accounts") || [];
            const address = this.#wallet(privateKey).getAddressString();

            let index = accounts?.length;
            if (address) {
                if (!keys?.some((s: string, i: number) => s?.toLowerCase() === privateKey?.toLowerCase())) this.#storage?.set(`${key}:seed`, [...keys, privateKey]);
                if (!this.#data()?.get(address?.toLowerCase())) this.#storage?.set(address?.toLowerCase(), { address, index, name: `Wallet ${index + 1}` });
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
            const account = this.accounts()?.[index] as Account;
            if (!account) throw new Error("There is no accounts that setup yet.");
            this.#data().set("account", account?.address);
            this.emit("accountChanged", account?.address);
            return account?.address;
        });
    }

    changeChain(chainId: number | string) {
        chainId = (typeof chainId === "string" ? (chainId?.startsWith("0x") ? parseChainId(chainId) : parseInt(chainId)) : chainId) as number;
        const chains = this.chains;
        if (chains?.length && chains?.find((c: Chain) => c?.chainId === chainId)) {
            if (typeof window !== "undefined") (window as any).ethereum = { chainId };
            this.#data().set("chain", chainId);
            this.emit("chainChanged", formatChainId(chainId));
            return chainId;
        } else throw new Error("There is no any chain registered.");
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

    async estimateGas(txParams: any) {
        return await this.#sendRpcRequest("eth_estimateGas", [txParams]);
    }

    async getGasPrice() {
        return await this.#sendRpcRequest("eth_gasPrice");
    }

    async sign(transaction: TransactionParams, signer: Account | string) {
        const privateKey = this.#getPrivateKey(typeof signer === 'object' ? signer?.index : this.#storage?.get(signer?.toLowerCase())?.index);
        const tx = new Transaction(transaction);
        console.log(transaction, tx);
        tx.sign(Buffer.from(privateKey?.substring(0, 64), "hex"));

        const txHash = await this.#broadcastTransaction(tx.serialize());
        console.log('Transaction hash:', txHash);  // Log to verify txHash

        // Await confirmation process
        const receipt = await this.waitForConfirmation(txHash);  // Ensure this resolves correctly

        if (receipt && receipt.status === 1) {
            console.log(`Transaction ${txHash} confirmed!`);
        } else {
            console.error(`Transaction ${txHash} failed.`);
        }

        return txHash;  // Now return after confirmation
    }

    async waitForConfirmation(txHash: string): Promise<any | null> {
        while (true) {
            const receipt = await this.getTransactionReceipt(txHash);

            if (!receipt) {
                // Handle case where receipt is not found (perhaps log and retry)
                console.warn(`No receipt found for transaction ${txHash}, retrying...`);
                await new Promise(resolve => setTimeout(resolve, 15000)); // Retry after 15 seconds
                continue;  // Skip the rest of the loop and try again
            }

            if (receipt.status === 1) {
                // Transaction confirmed successfully
                __notify({ title: "Transaction Confirmed", body: `Your transaction ${txHash} was confirmed.` });
                break;
            }

            if (receipt.status === 0) {
                // Transaction failed
                __notify({ title: "Transaction Failed", body: `Your transaction ${txHash} failed.` });
                break;
            }

            // Continue checking every 15 seconds
            await new Promise(resolve => setTimeout(resolve, 15000));
        }
    }

    async getTransactionReceipt(txHash: string) {
        const receipt = await this.#sendRpcRequest('eth_getTransactionReceipt', [txHash]);
        if (receipt) return receipt;  // Return the receipt if it's found
        return null;  // Return null explicitly if no receipt is found
    }

    async #sendRpcRequest(method: string, params: any[] = []) {
        const payload = {
            jsonrpc: "2.0",
            id: Date.now(),
            method,
            params,
        };

        for (const url of this.chain?.rpcUrls) {
            if (url.startsWith("wss://")) {
                const socket = new WebSocket(url);

                const webSocketResult = await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(`WebSocket timeout with ${url}`);
                        socket.close();
                    }, 10000); // 10 second timeout for WebSocket connection

                    socket.onopen = () => {
                        socket.send(JSON.stringify(payload));
                    };

                    socket.onmessage = (event) => {
                        const response = JSON.parse(event.data);
                        clearTimeout(timeout); // Clear timeout if we receive a message
                        if (response.error) reject(`WebSocket Error from ${url}: ${response.error}`);
                        else resolve(response.result);
                        socket.close();
                    };

                    socket.onerror = (error) => {
                        clearTimeout(timeout);
                        reject(`WebSocket error with ${url}: ${error}`);
                        socket.close();
                    };

                    socket.onclose = () => {
                        console.log(`WebSocket connection closed with ${url}`);
                    };
                });

                return webSocketResult;
            }

            // Handle HTTP/HTTPS URLs (http:// or https://)
            try {
                const response = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.error) {
                        console.warn(`RPC Error from ${url}:`, data.error);
                        continue; // Proceed with the next URL if there's an error
                    }
                    return data.result; // Return the result if no errors
                } else {
                    console.warn(`Failed request to ${url}: ${response.statusText}`);
                }
            } catch (error) {
                console.warn(`Network error with ${url}:`, error);
            }
        }

        throw new Error("All RPC requests failed");
    }

    async #broadcastTransaction(serializedTx: Buffer) {
        return await this.#sendRpcRequest("eth_sendRawTransaction", [`0x${serializedTx.toString("hex")}`]);
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
                        tx.sign((this.#storage?.get(`${this.#session?.get("key")}:seed`))[exist.index]);
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

    async getAddress() {
        return this.address;
    }

    async balance() {
        if (this.address) return await this.#sendRpcRequest("eth_getBalance", [this.address, "latest"]);
        else return 0;
    }
}
