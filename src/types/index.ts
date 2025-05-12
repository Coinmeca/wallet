

export interface Attribute {
    trait_type: string;
    value: string | number; // We allow 'value' to be a string or a number
}

export interface AttributesObject {
    [key: string]: string | number; // The object will have string keys and string or number values
}
export const zeroAddress = "0x0000000000000000000000000000000000000000";

export interface Validate {
    state?: boolean;
    message?: string;
}

export interface TokenURI {
    id?: string;
    key?: string;
    name?: string;
    market?: string;
    attributes?: { trait_type?: string; value?: any }
    description?: string;
};

export type ERC20Options = {
    decimals?: number;
    balance?: number;
};

export type ERC721Options = {
    owner?: string;
    tokenId?: string;
    image?: string;
    isVideo?: boolean;
    ur?: TokenURI;
};

export type ERC1155Options = {
    decimals?: number;
    tokenId?: string;
};

export const AssetType = {
    ERC20: "ERC20",
    ERC721: "ERC721",
    ERC1155: "ERC1155",
} as const;

export type AssetOptions<Name> = Name extends "ERC721" ? ERC721Options : Name extends "ERC1155" ? ERC1155Options : ERC20Options;

export interface Asset<Name extends keyof typeof AssetType = "ERC20"> {
    type: Name;
    address?: string;
    name?: string;
    symbol?: string;
    decimals?: number;
    balance?: number;
    owner?: string;
    tokenId?: string;
    image?: string;
    isVideo?: string;
    uri?: TokenURI;
}
