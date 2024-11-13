import { useQueries, useQuery } from '@tanstack/react-query';
import { query } from './query';

export function GetErc20(rpc?: string, erc20?: string, owner?: string) {
    return useQueries({ queries: [query.name(rpc, erc20), query.symbol(rpc, erc20), query.decimals(rpc, erc20), ...(owner ? [query.balanceOf(rpc, erc20, owner)] : [])] });
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
