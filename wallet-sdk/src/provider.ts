import CryptoJS from "crypto-js";
import Wallet from "ethereumjs-wallet";
import { Transaction } from "ethereumjs-tx";
import { bufferToHex, ecsign, hashPersonalMessage, keccak256, toBuffer } from "ethereumjs-util";
import { formatChainId, getFaviconUri, loadStorage, openWindow, parse, parseChainId } from "./utils";
import type { Account, App, Asset, Chain, EIP712Domain, EIP712Message, EIP712Types, TransactionParams } from "./types";
import axios from "axios";
import { getChainsByType } from "./chains";
import { CoinmecaWalletBase } from "./core";

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
    #count?: number;

    constructor(config?: CoinmecaWalletProviderConfig) {
        super();

        const { key, address, chainId } = config || {};
        this.#key = key;

        const data = this.#data();
        if (address) {
            if (key) this.changeAccount(address);
            else data?.set("address", address);
        } else {
            const last = data?.get("address");
            if (last) this.changeAccount(last);
        }

        if (chainId && data?.get("chains")?.find((c: Chain) => c?.chainId === chainId)) this.changeChain(chainId);
        else {
            const last = data?.get("chainId");
            if (last) this.changeChain(last?.chainId);
        }

        localStorage.clear = () => {
            console.error("Attempted to clear localStorage! This action is prevented.");
        };
        Object.freeze(loadStorage);

        (window as any).coinmeca = { wallet: this };
        Object.freeze(this);
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
        return loadStorage(this.codename, _?.storage || (isTelegram ? telegram?.CloudStorage : localStorage), _?.storage ? false : isTelegram, _?.key);
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

    async #nonce(address: string) {
        if (this.#count) return this.#count + 1;
        else return await this.#sendRpcRequest("eth_getTransactionCount", [address || this.address, "latest"]);
    }

    async #sendRpcRequest(method: string, params?: any) {
        console.log("sendRpcRequest");
        const rpc = this.chain?.rpcUrls?.[0];
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
        const test = this.#data({ storage: sessionStorage })?.get("address") || this.#data()?.get("address");
        console.log(this.#data({ storage: sessionStorage })?.get("address"), this.#data()?.get("address"), test);
        return test;
    }

    account(address?: string): Account {
        return this.#storage?.get?.((address || this.address)?.toLowerCase());
    }

    accounts(url?: string): (string | Account)[] {
        try {
            return (
                (url && url !== ""
                    ? this.#data()
                        ?.get("apps")
                        ?.find((a: App) => a?.url?.toLowerCase() === url?.toLowerCase())?.accounts
                    : this.#safe((key: string) => this.#storage?.get(`${key}:seed`)?.map((s: string) => this.#wallet(s)?.getAddressString()))?.map(
                        (a: string) => this.#storage?.get(a?.toLowerCase()),
                    )) || []
            ).filter((a: any) => a);
        } catch (e) {
            return [];
        }
    }

    allowance(url: string, address?: string) {
        address = address || this.address;
        return !!url && url !== "" && !!address && address !== "" && (this.accounts(url) as string[])?.some((a) => a?.toLowerCase() === address?.toLowerCase());
    }

    get chainId() {
        return formatChainId(this.#data({ storage: sessionStorage })?.get("chainId") || this.#data()?.get("chainId") || 1);
    }

    get chain() {
        return this.chains?.find((c: Chain) => c?.chainId === parseChainId(this.chainId || "0x1"));
    }

    get chains() {
        return this.#data().get("chains");
    }

    get apps() {
        return this.#data().get("apps");
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
        this.#data()?.set("address", this.account()?.address);
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
                const last: any = this.address || this.#storage?.get("address") || (this.accounts()?.[0] as Account)?.address;
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
                if (!keys?.some((s: string) => s?.toLowerCase() === seed?.toLowerCase())) this.#storage?.set(`${key}:seed`, [...keys, seed]);
                if (!this.#data()?.get(address?.toLowerCase())) this.#storage?.set(address?.toLowerCase(), { address, index, name: `Account ${index + 1}` });
                this.changeAccount(index);
                return true;
            } else return false;
        });
    }

    import(privateKey: string) {
        return this.#safe((key: string) => {
            const keys = this.#storage?.get(`${key}:seed`) || [];
            const accounts = this.#data()?.get("accounts") || [];
            const address = this.#wallet(privateKey).getAddressString();

            let index = accounts?.length;
            if (address) {
                if (
                    !keys?.some((s: string, i: number) => {
                        const check = s?.toLowerCase() === privateKey?.toLowerCase();
                        if (check) {
                            index = i;
                            return check;
                        }
                    })
                )
                    this.#storage?.set(`${key}:seed`, [...keys, privateKey]);
                if (!this.#data()?.get(address?.toLowerCase())) this.#storage?.set(address?.toLowerCase(), { address, index, name: `Account ${index + 1}` });
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

    changeAccount(index: number | string) {
        if (typeof index === 'undefined') return;
        return this.#safe(() => {
            index = typeof index === 'string' ? (this.#storage?.get(index?.toLowerCase()))?.index : index;
            if (typeof index !== 'number') return;
            const account = this.accounts()?.[index] as Account;
            this.#sendRpcRequest("eth_getTransactionCount", [account?.address, "latest"]).then((result) => {
                if (result) {
                    const count = Number(result);
                    if (!isNaN(count)) this.#count = count;
                }
            });
            if (!account) throw new Error("There is no accounts that setup yet.");
            this.#data()?.set("address", account?.address);
            this.#data({ storage: sessionStorage })?.set("address", account?.address);
            this.emit("accountChanged", account?.address);
            return account?.address;
        });
    }

    changeChain(chainId: number | string) {
        if (!chainId) return;
        chainId = (typeof chainId === "string" ? (chainId?.startsWith("0x") ? parseChainId(chainId) : parseInt(chainId)) : chainId) as number;
        const chains = this.chains;
        console.log({ chains, chainId });
        if (chains?.length && chains?.find((c: Chain) => c?.chainId === chainId)) {
            if (typeof window !== "undefined") (window as any).ethereum = { chainId };
            this.#data()?.set("chainId", chainId);
            this.#data({ storage: sessionStorage })?.set("chainId", chainId);
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


    async sign(transaction: TransactionParams, signer: Account | string) {
        const privateKey = this.#getPrivateKey(typeof signer === "object" ? signer?.index : this.#storage?.get(signer?.toLowerCase())?.index);
        if (this.chain?.chainId) transaction.chainId = this.chain.chainId;
        transaction.nonce = (await this.#nonce(typeof signer === "object" ? signer?.address : signer)).toString(16);
        const tx = new Transaction(transaction);
        tx.sign(Buffer.from(privateKey?.substring(0, 64), "hex"));
        return tx;
    }

    async send(signedTx: Transaction) {
        return await this.#sendRpcRequest("eth_sendRawTransaction", [`0x${signedTx.serialize().toString("hex")}`]);
    }

    // Background confirmation process without blocking the main flow
    async waitForConfirmation(txHash: string): Promise<void> {
        while (true) {
            const receipt = await this.getTransactionReceipt(txHash);

            if (!receipt) {
                console.warn(`No receipt found for transaction ${txHash}, retrying...`);
                await new Promise((resolve) => setTimeout(resolve, 15000)); // Retry every 15 seconds
                continue;
            }

            if (receipt.status === 1) {
                __notify({ title: "Transaction Confirmed", body: `Your transaction ${txHash} was confirmed.` });
                break;
            }

            if (receipt.status === 0) {
                __notify({ title: "Transaction Failed", body: `Your transaction ${txHash} failed.` });
                break;
            }

            await new Promise((resolve) => setTimeout(resolve, 15000));
        }
    }

    async getTransactionReceipt(txHash: string) {
        const receipt = await this.#sendRpcRequest("eth_getTransactionReceipt", [txHash]);
        if (receipt) return receipt; // Return the receipt if it's found
        return null; // Return null explicitly if no receipt is found
    }

    addFungibleAsset(address: string) {
        address = address?.toLowerCase();
        const chainId = this.chain?.chainId?.toString();
        let account = this.account();
        console.log({ account })
        console.log(1)
        if (account?.tokens?.fungibles) {
            console.log(2)
            const tokens = account.tokens.fungibles?.[chainId];
            if (Array.isArray(tokens)) {
                console.log(3)
                const exist = tokens?.map((a) => a?.toLowerCase() === address?.toLowerCase());
                if (!exist) {
                    console.log(4)
                    account.tokens.fungibles[chainId] = [...tokens, address];
                    this.#storage?.set(account?.address?.toLowerCase(), account);
                    this.emit("updateFungibleAsset");
                }
            } else {
                console.log(5)
                account.tokens.fungibles = { ...account.tokens.fungibles, [chainId]: [address] };
                this.#storage?.set(account?.address?.toLowerCase(), account);
                this.emit("updateFungibleAsset");
            }
        } else {
            console.log(6)
            if (account?.tokens) {
                console.log(7)
                account.tokens = { ...account.tokens, fungibles: { [chainId]: [address] } };
            } else {
                console.log(8)
                account = { ...account, tokens: { fungibles: { [chainId]: [address] } } }
            };
            this.#storage?.set(account?.address?.toLowerCase(), account);
            this.emit("updateFungibleAsset");
        }

        console.log({ account });
        console.log(this.#storage?.get(account?.address?.toLowerCase()));
    }

    removeFungibleAsset(address: string) {
        let account = this.account();
        const chainId = this.chain?.chainId?.toString();
        if (account?.tokens?.fungibles) {
            const tokens = account.tokens.fungibles?.[chainId];
            if (Array.isArray(tokens)) {
                const exist = tokens?.map((a) => a?.toLowerCase() === address?.toLowerCase());
                if (!exist) {
                    account.tokens.fungibles[chainId] = [...tokens?.filter(a => a?.toLowerCase() !== address?.toLowerCase())];
                    this.#storage?.set(account.address?.toLowerCase(), account);
                    this.emit("updateFungibleAsset");
                }
            }
        }
    }

    /* **************************************************** */

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

    async #getBlockNumber() {
        console.log("getBlockNumber");
        return await this.#sendRpcRequest("eth_blockNumber");
    }

    async #getBalance(address: string) {
        return await this.#sendRpcRequest("eth_getBalance", [address, "latest"]);
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
