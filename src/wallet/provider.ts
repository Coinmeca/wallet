import { Transaction } from "ethereumjs-tx";
import { Chain } from 'types';

const info = {
    info: {
        uuid: crypto.randomUUID(),
        name: "CoinmecaWallet",
        // icon: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22512%22%20height%3D%22512%22%20viewBox%3D%220%200%20512%20512%22%20fill%3D%22none%22%3E%3Crect%20width%3D%22512%22%20height%3D%22512%22%20rx%3D%22170.667%22%20fill%3D%22url%28%27%23paint0_linear_1098_5380%27%29%22%2F%3E%3Crect%20x%3D%2242.667%22%20y%3D%2242.667%22%20width%3D%22426.667%22%20height%3D%22426.667%22%20rx%3D%22170.667%22%20fill%3D%22%232461ED%22%2F%3E%3Cpath%20fill-rule%3D%22evenodd%22%20clip-rule%3D%22evenodd%22%20d%3D%22M286.757%20250.326c-41.73-22.55-92.506-51.794-130.72-75.629-11.276-8.123-5.553-25.364%208.074-25.364h189.086c10.548%200%2017.604%2011.761%2012.318%2020.66-12.706%2021.944-31.256%2049.805-46.75%2071.895-8.317%2011.857-21.872%2013.894-32.008%208.438Zm-60.862%207.323c40.349%2021.508%2096.895%2054.218%20137.074%2078.951%2012.415%207.663%207.468%2026.042-7.032%2026.042-23.728%200-62.285.007-100.641.013-37.961.006-75.725.012-98.726.012-11.59%200-17.531-12.027-12.609-20.417%2016.634-28.346%2035.33-56.959%2050.872-78.321%206.911-9.529%2020.975-11.663%2031.062-6.28Z%22%20fill%3D%22%23fff%22%2F%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22paint0_linear_1098_5380%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%22604.983%22%20y2%3D%22352.348%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%3Cstop%20stop-color%3D%22%232962EF%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23255CE5%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3C%2Fsvg%3E",
        rdns: "net.coinmeca.wallet",
    },
    provider: "...",
};

export abstract class WalletAdapter<Name extends string = string>
    implements Wallet<Name> {
    abstract name: WalletName<Name>;

    protected abstract _state: WalletReadyState;
    protected abstract _provider: any | null;
    protected abstract _chain: string | number | Chain | null;
    protected abstract _accounts: any[] | null;

    protected _connecting: boolean = false;

    abstract get provider(): any & EventEmitter<WalletAdapterEvents>;

    get state() {
        return this._state;
    };

    get address() {
        return Array.isArray(this._accounts) ? this._accounts[0] : this._accounts || '';
    }

    get connecting() {
        return this._connecting;
    }

    get connected() {
        return !!this._accounts;
    }

    abstract autoConnect(): Promise<void>;

    abstract connect(chain?: number | string | Chain): Promise<any>;

    abstract disconnect(): Promise<any>;

    // abstract sendTransaction(): Promise<void>;

    abstract chain(chain: number | string | Chain): Promise<any>;

    abstract on(listener: string, handler: Function | Promise<any>): void;

    abstract off(listener: string, handler?: Function | Promise<any>): void;
}

export const CoinmecaWalletName = "Coinmeca Wallet";

export class CoinmecaWalletProvider extends WalletAdapter<"Coinmeca Wallet"> {
    name = CoinmecaWalletName;

    protected _config: CoinmecaWalletAdapterConfig | undefined;
    protected _state: WalletReadyState = WalletReadyState.NotDetected;

    protected _provider: MetaMaskProvider | null;
    protected _chain: Chain | null;
    protected _accounts: string[] | null;

    constructor(wallet) {
        this.provider = wallet; // Your wallet instance
    }

    // Handle requests from the DApp
    async request({ method, params }) {
        switch (method) {
            case 'eth_sendTransaction':
                // When a transaction request is detected, show the signing modal
                return await this.showSigningModal(params[0]);
            case 'eth_signTransaction':
                // Similarly, handle signing-only requests
                return await this.showSigningModal(params[0]);
            // Add other cases like 'eth_sign', 'personal_sign', etc.
            default:
                throw new Error(`Method ${method} not supported`);
        }
    }

    // Function to show the signing modal
    async showSigningModal(transactionParams) {
        // Trigger your UI modal (custom implementation)
        this.triggerModalUI(transactionParams);

        // After user confirms, proceed to sign the transaction
        const signedTransaction = await this.signTransaction(transactionParams);

        // After signing, return the signed transaction or send it
        return await this.broadcastTransaction(signedTransaction);
    }

    // Example modal UI trigger (this is where you define your custom UI logic)
    triggerModalUI(transactionParams) {
        // Use HTML/JS to create a modal that shows transaction details
        console.log("Displaying signing modal for transaction:", transactionParams);

        // You can use frameworks like React, Vue, or even plain HTML/JS for the modal
        // The modal should display details (e.g., contract address, gas, value, etc.)
    }

    // Sign and broadcast functions
    async signTransaction(transactionParams) {
        ;
        const tx = new Transaction(transactionParams, { chain: 'mainnet' });
        tx.sign(this.provider.getPrivateKey());
        return '0x' + tx.serialize().toString('hex');
    }

    async broadcastTransaction(signedTransaction) {
        try {
            const txHash = await window.ethereum.request({
                method: 'eth_sendRawTransaction',
                params: [signedTransaction],
            });
            return txHash;
        } catch (error) {
            console.error('Error broadcasting transaction:', error);
        }
    }
}
