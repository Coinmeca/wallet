export interface NativeCurrency {
    name: string;
    symbol: string;
    decimals: number;
}

export interface Asset {
    type?: string;
    address?: string;
    symbol?: string;
    decimals?: string | number;
    image?: string;
}

export type ChainBase = "evm" | "svm";
export type ChainType = "mainnet" | "mainnet-beta" | "testnet" | "devnet";

export interface Chain {
    id: number;
    base: ChainBase;
    name: string;
    logo?: string;
    type?: ChainType;
    rpc: string[];
    explorer?: string[];
    nativeCurrency: NativeCurrency;
}

export interface Chains {
    [key: string]: {
        mainnet?: Chain;
        testnet?: {
            [key: string]: Chain | undefined;
        };
        devnet?: {
            [key: string]: Chain | undefined;
        };
    };
}

export interface Account {
    name: string;
    address: string;
    index: number;
    balance?: number;
    tokens?: {
        fts?: string[];
        nfts?: string[];
    };
}
