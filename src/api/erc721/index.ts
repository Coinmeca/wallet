import { useQueries, useQuery, UseQueryResult } from "@tanstack/react-query";
import { useCallback } from "react";
import { query } from "./query";

export function GetErc721(
    rpc?: string,
    erc721?: { [address: string]: string[] } | ({ [address: string]: string[] } | undefined)[]
): [
        { [address: string]: { [tokenId: string]: UseQueryResult<any, Error> } },
        (address?: string, tokenId?: string) => UseQueryResult<any, Error> | undefined
    ] {
    const tokens = Array.isArray(erc721) ? erc721.filter((entry) => entry).flatMap((entry) => Object.entries(entry!)) : erc721 ? Object.entries(erc721) : undefined;
    const tokenMap: { [address: string]: { [tokenId: string]: UseQueryResult<any, Error> } } = {};

    const queries = tokens?.flatMap(([address, tokenIds]) => tokenIds?.map((tokenId) => (query.token(rpc, address, tokenId))) || []) || [];
    const results = useQueries({ queries });

    console.log({ tokens, results });
    results?.forEach(({ data }, i) => {
        if (!tokenMap[data?.address || 'undefined']) tokenMap[data?.address || 'undefined'] = {};
        tokenMap[data?.address || 'undefined'][data?.tokenId || 'undefined'] = results?.[i];
    });
    return [tokenMap, useCallback((address?: string, tokenId?: string) => tokenMap?.[address || "undefined"]?.[tokenId || "undefined"], [tokenMap])];
}
