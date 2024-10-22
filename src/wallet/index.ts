import CryptoJS from "crypto-js";
import Wallet from "ethereumjs-wallet";

interface WalletModule {
    account: Wallet;
    address: string;
    privateKey: string;
}

interface CreateWallet {
    create: (seed: string) => WalletModule;
}

export function wallet(): CreateWallet;
export function wallet(privateKey: string): WalletModule;

export function wallet(privateKey?: string): CreateWallet | WalletModule {
    const modules = (privateKey: string) => {
        const privateKeyBuffer = Buffer.from(privateKey.substring(0, 64), "hex");

        const account = Wallet.fromPrivateKey(privateKeyBuffer);

        const address = account.getAddressString();

        return { account, address, privateKey } as const;
    };

    const create = (seed: string) => {
        return modules(CryptoJS.SHA256(seed).toString());
    };

    if (privateKey) return modules(privateKey);
    else return { create };
}
