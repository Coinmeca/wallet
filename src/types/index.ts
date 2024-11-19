export interface Asset {
    type?: string;
    address?: string;
    name?: string;
    symbol?: string;
    decimals?: number;
    balance?: number;
}

export const zeroAddress = "0x0000000000000000000000000000000000000000";
