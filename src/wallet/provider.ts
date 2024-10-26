import Wallet from 'ethereumjs-wallet';
import { Transaction } from 'ethereumjs-tx';
import { keccak256, ecsign, toBuffer, hashPersonalMessage, bufferToHex } from 'ethereumjs-util';

import EventEmitter from 'eventemitter3';
import axios from 'axios';
import { loadStorage, StorageController } from 'utils';
import { AccountInfo } from 'contexts/account';

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

// export interface CoinmecaWalletProvider extends Provider { }
// export interface CoinmecaWalletAdapterConfig extends WalletConfig { }

export interface CoinmecaWalletProviderConfig {
    privateKey?: string;
    chainId?: string;
    providerUrl?: string;
}

export class CoinmecaWalletProvider {
    private storage: StorageController;
    private events: EventEmitter;

    private wallet?: Wallet;
    private providerUrl?: string;

    public chainId: string;
    public address?: string;
    public isCoinmecaWallet = true;

    constructor(config?: CoinmecaWalletProviderConfig) {
        this.events = new EventEmitter();
        this.storage = loadStorage("coinmeca:wallet", this.isTelegram ? (window as any).Telegram?.WebApp?.CloudStorage : localStorage);

        // Check if the config object is provided before destructuring
        const { privateKey, chainId, providerUrl } = config || {};

        if (providerUrl) this.providerUrl = providerUrl;
        if (privateKey) this.changeAccount(privateKey);

        if (chainId) {
            this.chainId = chainId;
        } else {
            const storedChainId = this.storage.get('last:chainId');
            this.chainId = storedChainId || "0x1"; // Default to "0x1" if no stored chainId
        }
    }

    async request({ method, params }: { method: string; params?: any[] }) {
        switch (method) {
            // Account Management
            case 'eth_accounts':
                return [this.address];

            case 'eth_requestAccounts':
                this.emit('connect', { chainId: this.chainId });
                return [this.address];

            case 'eth_coinbase':
                return this.address;

            // Chain and Network
            case 'eth_chainId':
                return this.chainId;

            case 'net_version':
                return parseInt(this.chainId, 16).toString();

            // Transaction and Gas Estimation
            case 'eth_sendTransaction':
                if (!params || params.length === 0) throw new Error('No transaction parameters provided');
                return this.sendTransaction(params[0]);

            case 'eth_estimateGas':
                if (!params || params.length === 0) throw new Error('No transaction parameters provided');
                return await this.estimateGas(params[0]);

            case 'eth_gasPrice':
                return await this.getGasPrice();

            // Signing Methods
            case 'eth_sign':
                if (!params || params.length < 2) throw new Error('eth_sign requires address and message');
                return await this.signMessage(params[0], params[1]);

            case 'eth_signTypedData_v4':
                if (!params || params.length < 2) throw new Error('eth_signTypedData_v4 requires address and typed data');
                return await this.signTypedData(params[0], params[1]);

            case 'personal_sign':
                if (!params || params.length < 2) throw new Error('personal_sign requires message and address');
                return await this.signPersonalMessage(params[0], params[1]);

            case 'eth_signTransaction':
                if (!params || params.length === 0) throw new Error('No transaction parameters provided');
                return await this.signTransaction(params[0]);

            // Event Subscription
            case 'eth_subscribe':
            case 'eth_unsubscribe':
                throw new Error(`${method} is not supported. Subscription methods are not available in this wallet`);

            // Block and State Queries
            case 'eth_blockNumber':
                return await this.getBlockNumber();

            case 'eth_getBalance':
                if (!params || params.length < 1) throw new Error('eth_getBalance requires an address');
                return await this.getBalance(params[0]);

            case 'eth_getTransactionCount':
                if (!params || params.length < 1) throw new Error('eth_getTransactionCount requires an address');
                return await this.getTransactionCount(params[0]);

            case 'eth_getCode':
                if (!params || params.length < 1) throw new Error('eth_getCode requires an address');
                return await this.getCode(params[0]);

            case 'wallet_addEthereumChain':
                if (!params || params.length === 0) throw new Error('No chain parameters provided');
                return await this.addEthereumChain(params[0]);

            case 'wallet_watchAsset':
                if (!params || params.length === 0) throw new Error('No asset parameters provided');
                return await this.watchAsset(params[0]);

            // Custom or Unsupported Methods
            default:
                throw new Error(`Method '${method}' not supported`);
        }
    }

    get isTelegram() {
        return typeof window !== 'undefined' && (window as any)?.telegram
    }

    private hashDomain(domain: EIP712Domain) {
        return this.hashStruct('EIP712Domain', domain, {
            EIP712Domain: [
                { name: 'name', type: 'string' },
                { name: 'version', type: 'string' },
                { name: 'chainId', type: 'uint256' },
                { name: 'verifyingContract', type: 'address' },
                { name: 'salt', type: 'bytes32' },
            ],
        });
    }

    private encodeType(primaryType: string, types: EIP712Types) {
        let result = `${primaryType}(${types[primaryType].map(({ name, type }) => `${type} ${name}`).join(',')})`;
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
        const encodedTypes = ['bytes32'];
        const encodedValues = [this.typeHash(type, types)];

        for (const field of types[type]) {
            const value = data[field.name];
            if (types[field.type]) {
                encodedTypes.push('bytes32');
                encodedValues.push(this.hashStruct(field.type, value, types));
            } else if (field.type === 'string' || field.type === 'bytes') {
                encodedTypes.push('bytes32');
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
        if (!this.wallet) return new Error("Account doesn't setup yet.")
        const tx = new Transaction(txParams);
        tx.sign(this.wallet.getPrivateKey());
        return await this.broadcastTransaction(tx.serialize());
    }

    private async estimateGas(txParams: any) {
        return await this.sendRpcRequest('eth_estimateGas', [txParams]);
    }

    private async getGasPrice() {
        return await this.sendRpcRequest('eth_gasPrice');
    }

    private async signMessage(address: string, message: string) {
        if (!this.wallet || !this.address) return new Error("Account doesn't setup yet.")
        if (address.toLowerCase() !== this.address.toLowerCase()) throw new Error('Address does not match selected wallet address');
        const buffer = toBuffer(message);
        const hash = hashPersonalMessage(buffer);
        const signature = ecsign(hash, this.wallet.getPrivateKey());
        return bufferToHex(Buffer.concat([signature.r, signature.s, Buffer.from([signature.v])]));
    }

    private async signPersonalMessage(message: string, address: string) {
        return await this.signMessage(address, message);
    }

    private async signTransaction(txParams: any) {
        if (!this.wallet) return new Error("Account doesn't setup yet.")
        const tx = new Transaction(txParams);
        tx.sign(this.wallet.getPrivateKey());
        return `0x${tx.serialize().toString('hex')}`;
    }

    private async signTypedData(address: string, typedData: EIP712Message) {
        if (!this.wallet || !this.address) return new Error("Account doesn't setup yet.")
        if (address.toLowerCase() !== this.address.toLowerCase()) throw new Error('Address does not match selected wallet address');

        const domain = this.hashDomain(typedData.domain);
        const message = this.hashStruct(typedData.primaryType, typedData.message, typedData.types);
        const data = keccak256(Buffer.concat([toBuffer('0x1901'), domain, message]));
        const signature = ecsign(data, this.wallet.getPrivateKey());
        return bufferToHex(Buffer.concat([signature.r, signature.s, Buffer.from([signature.v])]));
    }

    private async getBlockNumber() {
        return await this.sendRpcRequest('eth_blockNumber');
    }

    private async getBalance(address: string) {
        return await this.sendRpcRequest('eth_getBalance', [address, 'latest']);
    }

    private async getTransactionCount(address: string) {
        return await this.sendRpcRequest('eth_getTransactionCount', [address, 'latest']);
    }

    private async getCode(address: string) {
        return await this.sendRpcRequest('eth_getCode', [address, 'latest']);
    }

    private async broadcastTransaction(serializedTx: Buffer) {
        return await this.sendRpcRequest('eth_sendRawTransaction', [`0x${serializedTx.toString('hex')}`])
    }

    private async sendRpcRequest(method: string, params: any[] = []) {
        if (!this.providerUrl) return new Error(`Provider URL was not setup yet.`);
        const response = await axios.post(this.providerUrl, {
            jsonrpc: '2.0',
            id: new Date().getTime(),
            method,
            params,
        });

        if (response.data.error) throw new Error(`RPC Error: ${response.data.error.message}`);
        return response.data.result;
    }

    private async addEthereumChain(chainParams: any) {
        // Check for required chain parameters
        const { chainId, chainName, rpcUrls, nativeCurrency } = chainParams;
        if (!chainId || !rpcUrls || rpcUrls.length === 0) throw new Error('Invalid chain parameters. `chainId` and at least one `rpcUrl` are required.');

        // Check if the current chainId matches the provided chainId
        if (this.chainId !== chainId) {
            // Emit a chain change event if updating the chainId
            this.chainId = chainId;
            this.providerUrl = rpcUrls[0]; // Update the provider URL to the first rpcUrl
            this.emit('chainChanged', chainId);
        }

        return { message: `Chain ${chainName} with chainId ${chainId} added successfully.` };
    }

    private async watchAsset(assetParams: any) {
        const { type, options } = assetParams;
        if (type !== 'ERC20') throw new Error('Unsupported asset type. Only ERC20 tokens are supported.');

        const { address, symbol, decimals, image } = options;
        if (!address || !symbol || decimals === undefined) throw new Error('Invalid asset options. `address`, `symbol`, and `decimals` are required.');

        this.emit('assetAdded', {
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
        if (this.address) return await this.sendRpcRequest('eth_getBalance', [this.address, 'latest']);
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

        const info: AccountInfo = this.storage.get(this.address);
        this.storage.set('last:wallet', info.index);

        this.emit('accountsChanged', [this.address]);
    }

    changeChain(chainId: string): void {
        if (this.chainId !== chainId) {
            this.chainId = chainId;
            this.storage.set('last:chainId', chainId);
            this.emit('chainChanged', chainId);
        }
    }

    changeProviderUrl(url: string): void {
        this.providerUrl = url;
    }
}
