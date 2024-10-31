import Wallet from "ethereumjs-wallet";
import { Transaction } from "ethereumjs-tx";
import { keccak256, ecsign, toBuffer, hashPersonalMessage, bufferToHex } from "ethereumjs-util";
import axios from "axios";

import EventEmitter from "eventemitter3";
import { formatChainId, loadStorage, StorageController } from "utils";
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

const handleWindowPopup = (target: string) => {
    const width = 360;
    const height = 720;

    // Get the current window's dimensions and position
    const currentWindowWidth = window.innerWidth;
    const currentWindowHeight = window.innerHeight;
    const currentWindowLeft = window.screenX;
    const currentWindowTop = window.screenY;

    // Calculate center position based on the current window
    const left = currentWindowLeft + (currentWindowWidth - width) / 2;
    const top = currentWindowTop + (currentWindowHeight - height) / 2;

    window.open(
        // "https://wallet.coinmeca.net",
        target,
        "_blank",
        `left=${left},top=${top},width=${width},height=${height},toolbar=no,location=no,menubar=no,status=no,resizable=no,scrollbars=no`,
    );
};

export interface CoinmecaWalletProviderConfig {
    privateKey?: string;
    chain?: Chain;
}

export class CoinmecaWalletProvider {
    private storage: StorageController;
    private wallet?: Wallet;
    private events: EventEmitter;

    public chain?: Chain;
    public address?: string;
    public isCoinmecaWallet = true;

    constructor(config?: CoinmecaWalletProviderConfig) {
        this.events = new EventEmitter();
        this.storage = loadStorage("coinmeca:wallet", this.isTelegram ? (window as any).Telegram?.WebApp?.CloudStorage : localStorage);

        // Check if the config object is provided before destructuring
        const { privateKey, chain } = config || {};
        if (privateKey) this.changeAccount(privateKey);
        if (chain) this.chain = chain;
    }

    async request({ method, params }: { method: string; params?: any[] }) {
        switch (method) {
            // Account Management
            case "eth_accounts":
                return [this.address];

            case "eth_requestAccounts":
                handleWindowPopup("/connect");
                this.emit("connect", { chainId: this.chainId });
                return [this.address];

            case "eth_coinbase":
                return this.address;

            // Chain and Network
            case "eth_chainId":
                return this.chainId;

            case "net_version":
                return this.chainId?.toString();

            // Transaction and Gas Estimation
            case "eth_sendTransaction":
                if (!params || params.length === 0) throw new Error("No transaction parameters provided");
                return this.sendTransaction(params[0]);

            case "eth_estimateGas":
                if (!params || params.length === 0) throw new Error("No transaction parameters provided");
                return await this.estimateGas(params[0]);

            case "eth_gasPrice":
                return await this.getGasPrice();

            // Signing Methods
            case "eth_sign":
                if (!params || params.length < 2) throw new Error("eth_sign requires address and message");
                return await this.signMessage(params[0], params[1]);

            case "eth_signTypedData_v4":
                if (!params || params.length < 2) throw new Error("eth_signTypedData_v4 requires address and typed data");
                return await this.signTypedData(params[0], params[1]);

            case "personal_sign":
                if (!params || params.length < 2) throw new Error("personal_sign requires message and address");
                return await this.signPersonalMessage(params[0], params[1]);

            case "eth_signTransaction":
                if (!params || params.length === 0) throw new Error("No transaction parameters provided");
                return await this.signTransaction(params[0]);

            // Event Subscription
            case "eth_subscribe":
            case "eth_unsubscribe":
                throw new Error(`${method} is not supported. Subscription methods are not available in this wallet`);

            // Block and State Queries
            case "eth_blockNumber":
                return await this.getBlockNumber();

            case "eth_getBalance":
                if (!params || params.length < 1) throw new Error("eth_getBalance requires an address");
                return await this.getBalance(params[0]);

            case "eth_getTransactionCount":
                if (!params || params.length < 1) throw new Error("eth_getTransactionCount requires an address");
                return await this.getTransactionCount(params[0]);

            case "eth_getCode":
                if (!params || params.length < 1) throw new Error("eth_getCode requires an address");
                return await this.getCode(params[0]);

            case "wallet_addEthereumChain":
                if (!params || params.length === 0) throw new Error("No chain parameters provided");
                return await this.addEthereumChain(params[0]);

            case "wallet_watchAsset":
                if (!params || params.length === 0) throw new Error("No asset parameters provided");
                return await this.watchAsset(params[0]);

            // Custom or Unsupported Methods
            default:
                throw new Error(`Method '${method}' not supported`);
        }
    }

    get chainId() {
        return typeof this.chain?.chainId === "number" ? formatChainId(this.chain.chainId) : this.chain?.chainId;
    }

    get isTelegram() {
        return typeof window !== "undefined" && (window as any)?.telegram;
    }

    private hashDomain(domain: EIP712Domain) {
        return this.hashStruct("EIP712Domain", domain, {
            EIP712Domain: [
                { name: "name", type: "string" },
                { name: "version", type: "string" },
                { name: "chainId", type: "uint256" },
                { name: "verifyingContract", type: "address" },
                { name: "salt", type: "bytes32" },
            ],
        });
    }

    private encodeType(primaryType: string, types: EIP712Types) {
        let result = `${primaryType}(${types[primaryType].map(({ name, type }) => `${type} ${name}`).join(",")})`;
        const uniqueTypes = new Set<string>();

        for (const field of types[primaryType] || []) {
            if (!uniqueTypes.has(field.type) && types[field.type]) {
                uniqueTypes.add(field.type);
                result += this.encodeType(field.type, types);
            }
        }
        return result;
    }

    private typeHash(primaryType: string, types: EIP712Types) {
        return keccak256(Buffer.from(this.encodeType(primaryType, types)));
    }

    private encodeData(type: string, data: any, types: EIP712Types) {
        const encodedTypes = ["bytes32"];
        const encodedValues = [this.typeHash(type, types)];

        for (const field of types[type]) {
            const value = data[field.name];
            if (types[field.type]) {
                encodedTypes.push("bytes32");
                encodedValues.push(this.hashStruct(field.type, value, types));
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

    private hashStruct(primaryType: string, data: any, types: EIP712Types) {
        return keccak256(this.encodeData(primaryType, data, types));
    }

    private async sendTransaction(txParams: any) {
        if (!this.wallet) return new Error("Account doesn't setup yet.");
        const tx = new Transaction(txParams);
        tx.sign(this.wallet.getPrivateKey());
        return await this.broadcastTransaction(tx.serialize());
    }

    private async estimateGas(txParams: any) {
        return await this.sendRpcRequest("eth_estimateGas", [txParams]);
    }

    private async getGasPrice() {
        return await this.sendRpcRequest("eth_gasPrice");
    }

    private async signMessage(address: string, message: string) {
        if (!this.wallet || !this.address) return new Error("Account doesn't setup yet.");
        if (address.toLowerCase() !== this.address.toLowerCase()) throw new Error("Address does not match selected wallet address");
        const buffer = toBuffer(message);
        const hash = hashPersonalMessage(buffer);
        const signature = ecsign(hash, this.wallet.getPrivateKey());
        return bufferToHex(Buffer.concat([signature.r, signature.s, Buffer.from([signature.v])]));
    }

    private async signPersonalMessage(message: string, address: string) {
        return await this.signMessage(address, message);
    }

    private async signTransaction(txParams: any) {
        if (!this.wallet) return new Error("Account doesn't setup yet.");
        const tx = new Transaction(txParams);
        tx.sign(this.wallet.getPrivateKey());
        return `0x${tx.serialize().toString("hex")}`;
    }

    private async signTypedData(address: string, typedData: EIP712Message) {
        if (!this.wallet || !this.address) return new Error("Account doesn't setup yet.");
        if (address.toLowerCase() !== this.address.toLowerCase()) throw new Error("Address does not match selected wallet address");

        const domain = this.hashDomain(typedData.domain);
        const message = this.hashStruct(typedData.primaryType, typedData.message, typedData.types);
        const data = keccak256(Buffer.concat([toBuffer("0x1901"), domain, message]));
        const signature = ecsign(data, this.wallet.getPrivateKey());
        return bufferToHex(Buffer.concat([signature.r, signature.s, Buffer.from([signature.v])]));
    }

    private async getBlockNumber() {
        return await this.sendRpcRequest("eth_blockNumber");
    }

    private async getBalance(address: string) {
        return await this.sendRpcRequest("eth_getBalance", [address, "latest"]);
    }

    private async getTransactionCount(address: string) {
        return await this.sendRpcRequest("eth_getTransactionCount", [address, "latest"]);
    }

    private async getCode(address: string) {
        return await this.sendRpcRequest("eth_getCode", [address, "latest"]);
    }

    private async broadcastTransaction(serializedTx: Buffer) {
        return await this.sendRpcRequest("eth_sendRawTransaction", [`0x${serializedTx.toString("hex")}`]);
    }

    private async sendRpcRequest(method: string, params: any[] = []) {
        const rpc = await this.rpcUrl();
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

    private async addEthereumChain(chain: Chain) {
        // Check for required chain parameters
        const { chainId, chainName, rpcUrls, nativeCurrency } = chain;
        if (!chainId || !rpcUrls || rpcUrls.length === 0 || !nativeCurrency.decimals)
            throw new Error("Invalid chain parameters. `chainId` and at least one `rpcUrl` are required.");

        // Check if the current chainId matches the provided chainId

        this.chain = chain;
        this.emit("chainChanged", formatChainId(chainId));

        return { message: `Chain ${chainName} with chainId ${chainId} added successfully.` };
    }

    private async watchAsset(asset: Asset<"ERC20" | "ERC721" | "ERC1155">) {
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

    private async rpcUrl() {
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
        if (this.address) return await this.sendRpcRequest("eth_getBalance", [this.address, "latest"]);
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

    // Trigger account and chain change events
    changeAccount(privateKey: string): void {
        this.wallet = Wallet.fromPrivateKey(Buffer.from(privateKey.substring(0, 64), "hex"));
        this.address = this.wallet.getAddressString();

        const info: Account = this.storage.get(this.address);
        // this.storage.set("last:wallet", info.index);

        this.emit("accountsChanged", [this.address]);
    }

    changeChain(chain: Chain): void {
        const chainId = formatChainId(chain.chainId);
        if (this.chainId !== chainId) {
            if (window) window.ethereum.chainId = chainId;
            // this.storage.set("last:chainId", chainId);
            this.emit("chainChanged", chain);
        }
    }
}
