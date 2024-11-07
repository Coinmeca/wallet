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
    key?: string;
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
    #key?: string;

    private events: EventEmitter;
    public isCoinmecaWallet = true;

    constructor(config?: CoinmecaWalletProviderConfig) {
        const data = this.#data();

        const { key, chain } = config || {};
        this.#key = key;
        if (chain) data.set("last:chain", chain);
        this.events = new EventEmitter();

        localStorage.clear = () => {
            console.error("Attempted to clear localStorage! This action is prevented.");
        };

        return this.#announce(this.#proxy);
    }

    #announce(provider: any) {
        window.ethereum = { ...window.ethereum, ...provider };
        window.ethereum.providers = window.ethereum.providers || [];
        if (!window.ethereum.providers.find((p: any) => p?.isCoinmecaWallet)) window.ethereum.providers.push(provider);

        if (!window.ethereum.providerMap) window.ethereum.providerMap = new Map<string, any>(); // Ensure providerMap is initialized
        window.ethereum.providerMap.set("CoinmecaWallet", provider);

        new CustomEvent("eip6963:announceProvider", {
            detail: {
                info: {
                    name: "Coinmeca Wallet",
                    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAFT0lEQVR4AbVWBWxbVxQ975ND3+GkzBBORmVmZqYxB8bMvBXGaQdWmSHpmJkXLDMF1YBaq3O5Z35WubYbPNKR7E/vwrmAqsLeeF3okeavTSlvOsJW3CYxa39is7I9XcJP7xkaePrAjIDyg0/5Z9kXB3x0/F//ydxuhqGuUG5ujyryX23bYNxxaL3SnrMQwBRonCwUjhSCoxTBqarg/T6C74ULftdDcM+L6mH7j8b8438Y8agp/sJf1h2WrTN/UtMdr6E7RyKE7aAzCIIWgKqTylnK3/JaiADjFHCaLzg/HtzxmuJw5Bozy7bBRHWQZZRH/aRtynsdz7IfYhgBX2oQBFAl6k42U8DpAeDnw8GKb5S849uNKFQF/+j/3bBc2VoyAw+zJVpQh0oANaJFgDcY4PsJYPEqpfREiX4DvGGN0/M56o7S/niUoWhM4cXrqlJxsq0GzmwHFq9WSugpErawMvNxy4G8G/AKrWhKnD28LijOGpGeAFZ8q+RW/AUrLkdySNnMeLGcJuKueriqqgwMDGTjxo0l5W957aqRkOn4fAToyDdm4mKMb1UQn+SX4wgQYyhgePyIj48PR4wYwYyMDBYWFvLo0aMuFhQUcN26dRw2bBgtFotXTUw3wZ1vKI7j5Rel4trWRfMD1HepioYeX27atCkzMzN56tQpesLJkyddxjVs6OU7Kjg/ATzyu2GDxHWT7WFhTTYe1sQ4AprHw7Ozs1kVnDlzhqmpqV5LdJofuO9V7RALzVBETq6crJuZFKK9+7BZLNJztwdJjyXl73PX5s2bRz8/P696iFPB73oJHs+1ToE5rugjYbxOIMjtw8OHD3cdcjH27dvHlJQUxsbGMi4ujsnJydy9ezfT09OvejjOdsx3IwXtS/xt8Bm9K0to9xAw3Kpdiuti7N27lzExMRTiQqXI3yEhITQMo2oNysn7fQUPPu2fBWPs5nKhjifcdDxZXlLhF4f93nvvrXVfUJ2cqgkW3GyWQZ+afxraMHe1L2tcltnFKpdhr5PuKKfo3uFBzrPv8GxAo0aN6s0AOcr3dAt3nv3IpjJYJhJQ3KZANpyLUyDFJ4SodQomC5X7k5qXQ5uzLQsByVUWoawAKUIAl4gwNDS0yiI0nEyBweK2iVnQ1++1oclMQgl2+7BsvbL7XW6ELL1zZZiWluYqw7lz51apDOVSM0uYrGw++kMYWwumYEAGoUV76v+yvdZpI2oHg+uVKDpavDEZsNtDldezDyFgktdWnJOTw6rgrE48Hq5BcCRCudFy12G2+zEMEvofu21ITCe0xlcdRtJjT5CpkprxNowi4MfX0YNF/hnzcQ5G+d4o8dpfDlgnEcL7OJatWaZENqjLx7G8520ca1DZH7H8WZ3nOBJcEI+LoW3eMxNDVhCWa+tlIREQbIUWfAPPc49l10xcgYqdVuXrTXmIn03orep0JQOEa8e8EY/wN217XhnKTLiDYS+OUlbklaDti3VohKAVzTgAj3OlsqN0u3E8Ct6glx+4QVmRW+qKhM+1bjRRdQoYtCKeHfEq31J3leTqJ25AVSBFqXyzOQ9DVxCBk89Wh1aNwzXXemeKsUxQVvAp36Lcr03peXVQts2UwnRVR1I6YU4i9GhCCTobFcVJcZbyt0GIINdmpTkPNtX3mOSf50gNqZy5JKTCiprCqCyI13/fNV+ZmX1YDMwgms0irMmEz0TCGEahS4538h4qljdoWDMZ3nTToWvbHrTd1M4ehbqCaS8OM7YWTdY/3feh/ta2LOcULdfvzD+tT99w2jJhS5nvmN1ZzvXO1mhq5ZQOM+yhqCL+B+AWe5nrKa3ZAAAAAElFTkSuQmCC",
                    uuid: crypto.randomUUID(),
                    rdns: "net.coinmeca.wallet",
                },
                provider,
            },
        });

        return provider;
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
        return loadStorage(this.#codename, _?.storage || isTelegram ? telegram?.CloudStorage : localStorage, _?.storage ? false : isTelegram, _?.key);
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

    get #proxy() {
        const handler = {
            get: (target: any, prop: string) => {
                if (typeof target[prop] === "function") return (...args: any[]) => target[prop](...args);
                return target[prop];
            },
        };

        return new Proxy(this, handler);
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
        return this.#data()?.get("last:chain");
    }

    get chainId() {
        return this.chain?.chainId ? formatChainId(this.chain.chainId) : undefined;
    }

    init(hash: string) {
        if (this.#userId) new Error("Wallet already initialized.");
        const userId = this.isTelegram ? (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user : crypto.randomUUID();
        if (!userId) new Error("Wallet already initialized.");

        this.#data()?.set("userId", userId);
        const key = CryptoJS.SHA256(`${userId}:${hash}`).toString();
        this.#key = key;
        this.#storage?.set(key, key);
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
            } else return new Error("Not found account info.");
        } else return new Error("Invalid key entered.");
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
                    this.#storage?.set(`${key}:accounts`, [...(this.#storage?.get(`${key}:accounts`) || []), privateKey])
                };
                this.changeAccount(index);
                return true;
            } else return false;
        })
    }

    change(key: string, newHash: string) {
        const old = CryptoJS.SHA256(`${this.#userId}:${key}`).toString();
        this.#data({ key }).set(CryptoJS.SHA256(`${this.#userId}:${newHash}`).toString(), this.#getKey(key));
        this.#data({ key }).remove(old);
    }

    changeAccount(index: number): void {
        return this.#safe(() => {
            const account = this.accounts?.[index];
            if (!account) return new Error("There is no accounts that setup yet.");
            this.#data().set("last:account", account?.address);
            this.emit("accountChanged", account?.address);
        });
    }

    changeChain(chain: Chain): void {
        const chainId = formatChainId(chain.chainId);
        if (this.chainId !== chainId) {
            // (window as any)?.ethereum = { chainId };
            this.#data().set("last:chain", chain);
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
        if (!this.#wallet || !this.address) return new Error("Account doesn't setup yet.");
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
                if (!account) return new Error("Account information is something wrong.");

                const method = "eth_signTransaction";
                return await __promise(method, this.#confirm(method), [txParams, await this.#app()]).then(async (result: any) => {
                    if (result) {
                        const tx = new Transaction(txParams);
                        tx.sign((this.#storage?.get(`${this.#session?.get("key")}:accounts`))[exist.index]);
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
