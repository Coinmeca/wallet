import CryptoJS from 'crypto-js';
import Wallet from 'ethereumjs-wallet';

export const wallet = (seed: string) => {
    const privateKey = CryptoJS.SHA256(seed).toString();
    // const privateKey = seed?.includes(":") ? CryptoJS.SHA256(seed).toString() : seed;
    const privateKeyBuffer = Buffer.from(privateKey.substring(0, 64), 'hex');

    const account = Wallet.fromPrivateKey(privateKeyBuffer);
    const address = account.getAddressString();

    return { account, address, privateKey };
}