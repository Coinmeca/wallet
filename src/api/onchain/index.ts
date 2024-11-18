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

export function GetMaxFeePerGas(rpc?: string) {
    const results = useQueries({
        queries: [query.lastBlock(rpc), query.maxPriorityFeePerGas(rpc)],
    });

    const [blockResult, maxPriorityResult] = results;
    const isLoading = results.some((result) => result.isLoading);
    const isFetching = results.some((result) => result.isFetching);
    const isFetched = results.some((result) => result.isFetched);
    const isError = results.some((result) => result.isError);
    const isSuccess = results.some((result) => result.isSuccess);
    const isPaused = results.some((result) => result.isPaused);
    const isPending = results.some((result) => result.isPending);
    const isRefetching = results.some((result) => result.isRefetching);

    const baseFeePerGas = Number(blockResult?.data?.baseFeePerGas || 0);
    const maxPriorityFee = Number(maxPriorityResult?.data?.raw || 0);
    const raw = baseFeePerGas + maxPriorityFee;

    return {
        isLoading,
        isFetching,
        isFetched,
        isError,
        isSuccess,
        isPaused,
        isPending,
        isRefetching,
        data: {
            raw,
            format: raw / 1e9,
        },
    }
}
