import { Wallet } from 'ethereumjs-wallet';
import { Transaction } from 'ethereumjs-tx';
import EventEmitter from 'eventemitter3';
import axios from 'axios';

interface EthereumProviderRequest {
    method: string;
    params?: any[];
}

interface TransactionParams {
    from: string;
    to: string;
    value: string;
    gas: string;
    gasPrice: string;
    data?: string;
}

// export interface CoinmecaWalletProvider extends Provider { }
// export interface CoinmecaWalletAdapterConfig extends WalletConfig { }

interface EthereumProviderRequest {
    method: string;
    params?: any[];
}

interface TransactionParams {
    from: string;
    to: string;
    value: string;
    gas: string;
    gasPrice: string;
    data?: string;
}


export class CoinmecaWalletProvider extends EventEmitter {
    private wallet: Wallet;
    private chainId: string;
    private providerUrl: string;
    private events: EventEmitter;
    public address: string;


    constructor(wallet: Wallet, providerUrl: string, chainId: string = '0x1') {
        super();
        this.wallet = wallet;
        this.chainId = chainId;
        this.address = wallet.getAddressString();
        this.providerUrl = providerUrl; // URL of the Ethereum node (Infura, Alchemy, etc.)
        this.events = new EventEmitter();
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

            // Custom or Unsupported Methods
            default:
                throw new Error(`Method ${method} not supported`);
        }
    }

    private async sendTransaction(txParams: any) {
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
        if (address.toLowerCase() !== this.address.toLowerCase()) throw new Error('Address does not match selected wallet address');
        const buffer = Buffer.from(message, 'utf8');
        const hash = this.wallet.sign(buffer);
        return `0x${hash.toString('hex')}`;
    }

    private async signPersonalMessage(message: string, address: string) {
        return await this.signMessage(address, message);
    }

    private async signTransaction(txParams: any) {
        const tx = new Transaction(txParams);
        tx.sign(this.wallet.getPrivateKey());
        return `0x${tx.serialize().toString('hex')}`;
    }

    private async getBlockNumber() {
        const response = await this.sendRpcRequest('eth_blockNumber');
        return response; // Return block number from the response
    }

    private async getBalance(address: string) {
        const response = await this.sendRpcRequest('eth_getBalance', [address, 'latest']);
        return response; // Return balance in Wei from the response
    }

    private async getTransactionCount(address: string) {
        const response = await this.sendRpcRequest('eth_getTransactionCount', [address, 'latest']);
        return response; // Return transaction count (nonce) from the response
    }

    private async getCode(address: string) {
        const response = await this.sendRpcRequest('eth_getCode', [address, 'latest']);
        return response; // Return contract bytecode (or '' for EOAs) from the response
    }

    private async broadcastTransaction(serializedTx: Buffer) {
        const response = await this.sendRpcRequest('eth_sendRawTransaction', [`0x${serializedTx.toString('hex')}`]);
        return response; // Return the transaction hash
    }

    private async sendRpcRequest(method: string, params: any[] = []) {
        const response = await axios.post(this.providerUrl, {
            jsonrpc: '2.0',
            id: new Date().getTime(),
            method,
            params,
        });

        if (response.data.error) {
            throw new Error(`RPC Error: ${response.data.error.message}`);
        }

        return response.data.result;
    }

    async getAddress() {
        return this.address;
    }

    // Event handling with EventEmitter3
    // on(event: Event, fn: (...args: any[]) => void, context?: any): void {
    //     this.events.on(event, listener);
    // }

    // emit(event: string, ...args: any[]): void {
    //     this.events.emit(event, ...args);
    // }

    // Trigger account and chain change events
    changeAccount(address: string): void {
        this.address = address;
        this.emit('accountsChanged', [address]);
    }

    changeChain(chainId: string): void {
        this.chainId = chainId;
        this.emit('chainChanged', chainId);
    }
}

// Inject the provider into window.ethereum
declare global {
    interface Window {
        ethereum?: CoinmecaWalletProvider;
        providers?: any;
    }
}

// // Replace `myWalletInstance` with your actual wallet instance
// const myWalletInstance = Wallet.generate(); // For example purposes
// window.ethereum = new CoinmecaWalletProvider(myWalletInstance);

// // Inject the custom provider into window.ethereum
// if (!window.ethereum) {
//     // Initialize window.ethereum if it doesn’t exist
//     window.ethereum = {
//         providers: [myCustomProvider],
//     } as Window;
// } else {
//     // If window.ethereum already exists, add the provider to providers array
//     window.ethereum.providers = window.ethereum.providers || [];
//     window.ethereum.providers.push(myCustomProvider);
// }

// // Define main provider compatibility (optional)
// window.ethereum = myCustomProvider;

// // Emit register event for EIP-6963
// window.dispatchEvent(new CustomEvent('ethereum#initialized', { detail: { provider: myCustomProvider } }));

// // Add compatibility properties
// window.ethereum.isCustomWallet = true;
// window.ethereum.address = myCustomProvider.address;

// // Optional: If your wallet is the primary, set it as `window.ethereum`
// if (!window.ethereum.isPrimary) {
//     window.ethereum.isPrimary = true;
// }