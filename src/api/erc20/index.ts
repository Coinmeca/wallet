import { useQueries, useQuery, UseQueryOptions } from "@tanstack/react-query";
import { query } from "./query";

export function GetErc20(rpc?: string, erc20?: (string | undefined)[], owner?: string) {
    let data;
    let results: any;

    // Ensure `erc20` is always an array, even if empty
    const validTokens = Array.isArray(erc20) ? erc20.filter((a) => a) : [];

    // Build `queryConfigs` based on tokens available
    const queryConfigs: UseQueryOptions<any, Error, any, any[]>[] = validTokens.flatMap((token) => [
        query.name(rpc, token),
        query.symbol(rpc, token),
        query.decimals(rpc, token),
        ...(owner ? [query.balanceOf(rpc, token, owner)] : []),
    ]);

    // Always call `useQueries` regardless of conditions
    results = useQueries({ queries: queryConfigs });

    // Process data if there are valid tokens
    if (validTokens.length > 0) {
        data = validTokens.reduce((acc, address, index) => {
            if (address) {
                acc[address] = {
                    address,
                    name: results[index * 4]?.data,
                    symbol: results[index * 4 + 1]?.data,
                    decimals: results[index * 4 + 2]?.data,
                    balance: owner ? results[index * 4 + 3]?.data : undefined,
                };
            }
            return acc;
        }, {} as Record<string, any>);

        data = Object.keys(data).length > 0 ? data : undefined;
    }

    return {
        isError: results?.some((result: any) => result?.isError),
        isPaused: results?.some((result: any) => result?.isPaused),
        isPending: results?.some((result: any) => result?.isPending),
        isLoading: results?.some((result: any) => result?.isLoading),
        isFetching: results?.some((result: any) => result?.isFetching),
        isFetched: results?.some((result: any) => result?.isFetched),
        isSuccess: results?.every((result: any) => result?.isSuccess),
        isRefetching: results?.every((result: any) => result?.isRefetching),
        data,
    };
}

export function GetErc20Name(rpc?: string, erc20?: string) {
    return useQuery(query.name(rpc, erc20));
}

export function GetErc20Symbol(rpc?: string, erc20?: string) {
    return useQuery(query.symbol(rpc, erc20));
}

export function GetErc20Decimals(rpc?: string, erc20?: string) {
    return useQuery(query.decimals(rpc, erc20));
}

export function GetErc20BalanceOf(rpc?: string, erc20?: string, user?: string) {
    return useQuery(query.balanceOf(rpc, erc20, user));
}
