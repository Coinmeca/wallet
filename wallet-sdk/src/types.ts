export type ChainBase = "evm" | "svm";
export type ChainType = "mainnet" | "mainnet-beta" | "testnet" | "devnet";

export interface Chain {
    base?: ChainBase;
    type?: ChainType;
    logo?: string;
    chainId: number | string;
    chainName?: string;
    nativeCurrency: NativeCurrency;
    rpcUrls: string[];
    blockExplorerUrls?: string[];
    iconUrls?: string[];
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

export interface RequestParams {
    method: string;
    params?: any[];
}

export interface TransactionParams {
    // Basic Transaction Fields
    from: string;
    to: string;
    value: string;
    gas?: string;
    gasPrice?: string;
    data?: string;
    nonce?: string;
    chainId?: number;

    // EIP-1559 Specific Fields
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;

    // Optional fields for specific transaction types and networks
    type?: string;
    // Access list for EIP-2930 and EIP-1559 transactions
    accessList?: Array<{
        address: string;
        storageKeys: string[];
    }>;

    // Token Transfer Fields (ERC20/ERC721)
    tokenAddress?: string;
    tokenAmount?: string;
    tokenData?: string;

    // Advanced Fields for Complex Transactions
    validUntil?: string;
    replayProtection?: boolean;
    chainReference?: string;
    signature?: string;
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

export interface NativeCurrency {
    name: string;
    symbol: string;
    decimals: number;
}

export interface App {
    name?: string;
    url?: string;
    logo?: string;
    accounts?: string[];
}

export type AssetOptions<Name> = Name extends "ERC20" ? ERC20Options : Name extends "ERC721" ? ERC721Options : Name extends "ERC1155" ? ERC1155Options : never;

export interface Asset<Name extends "ERC20" | "ERC721" | "ERC1155"> {
    type: Name;
    options: AssetOptions<Name>;
}

export interface Account {
    name: string;
    address: string;
    index: number;
    balance?: number;
    tokens?: {
        fungibles?: string[];
        nonFungibles?: string[];
        multiTokens?: string[];
    };
}
