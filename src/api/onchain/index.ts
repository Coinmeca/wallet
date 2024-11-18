import { useQueries, useQuery } from "@tanstack/react-query";
import { query } from "./query";

export function GetRpcUrls() {
    return useQuery(query.rpcUrls());
}

export function GetGasPrice(rpc?: string) {
    return useQuery(query.gasPrice(rpc));
}

export function GetEstimateGas(rpc?: string, params?: any) {
    return useQuery(query.estimateGas(rpc, params));
}

export function AccountType(rpc?: string, address?: string) {
    return useQuery(query.accountType(rpc, address));
}

export function GetNonce(rpc?: string, address?: string) {
    return useQuery(query.nonce(rpc, address));
}

export function GetLastBlock(rpc?: string) {
    return useQuery(query.lastBlock(rpc));
}

export function GetMaxPriorityFeePerGas(rpc?: string) {
    return useQuery(query.maxPriorityFeePerGas(rpc));
}

export function GetMaxFeePerGas(rpc?: string, params?: any) {
    const [block, maxPriorityFeePerGas] = useQueries({ queries: [query.lastBlock(rpc), query.maxFeePerGas(rpc), query.maxPriorityFeePerGas(rpc)] });
    const baseFeePerGas = block?.data?.baseFeePerGas ? Number(block?.data?.baseFeePerGas) : 0;
    return baseFeePerGas + maxPriorityFeePerGas;
} 
