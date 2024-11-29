export interface Asset {
    type?: string;
    address?: string;
    name?: string;
    symbol?: string;
    decimals?: number;
    balance?: number;
}

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
