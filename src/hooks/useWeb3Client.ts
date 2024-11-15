import { Chain } from '@coinmeca/wallet-sdk/types';
import { parseChainId } from 'utils';
import { WalletClient, WalletClientConfig, createWalletClient } from 'viem';
import { create } from 'zustand';

type BaseWalletClientConfig = Omit<WalletClientConfig, 'chain'>;
interface Web3ClientConfig extends BaseWalletClientConfig {
    chain: Chain;
}

interface Web3Client {
    web3ClientConfig?: Web3ClientConfig;
    web3Client?: WalletClient & { chain?: Chain };
}

interface Web3ClientAction extends Web3Client {
    setWeb3Client: (config: Web3ClientConfig) => any;
    resetWeb3Client: () => any;
}

export const useWeb3Client = create<Web3Client & Web3ClientAction>((set: any) => ({
    web3Client: undefined,
    publicClient: undefined,
    walletClient: undefined,
    setWeb3Client: (config) => set((state: Web3Client & Web3ClientAction) => {
        const client = createWalletClient({
            ...state?.web3ClientConfig, ...config, chain: {
                id: parseChainId(config?.chain?.chainId),
                name: config?.chain?.chainName!,
                nativeCurrency: config?.chain?.nativeCurrency!,
                rpcUrls: {
                    default: { http: config?.chain?.rpcUrls?.filter((c) => c?.startsWith('http')) || [], webSocket: config?.chain?.rpcUrls.filter((c) => c?.startsWith('wss')) },
                },
            }
        });
        return {
            ...state,
            walletClientConfig: { ...state?.web3ClientConfig, config },
            walletClient: client,
            web3Client: client
        }

    }),
    resetWeb3Client: () => set((state: Web3Client & Web3ClientAction) => ({ ...state, walletClientConfig: undefined, walletClient: undefined })),
}));