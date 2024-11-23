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
    let tokens = Array.isArray(erc721) ? erc721.filter((a) => a) : erc721 ? [erc721] : undefined;
    let tokenMap: { [address: string]: { [tokenId: string]: UseQueryResult<any, Error> } } = {};

    const results = useQueries({
        queries: tokens
            ?.flatMap((entry) =>
                entry
                    ? Object.entries(entry).flatMap(([address, tokenIds]) =>
                        tokenIds.map((tokenId) => ({ address, tokenId }))
                    )
                    : []
            )
            ?.map(({ address, tokenId }) =>
                query.token(rpc, address, tokenId)
            ) || []
    });

    tokens?.forEach((token, i) => {
        const address = Object.keys(token || {})[0]
        tokenMap[address || "undefined"][token?.[address || 'undefined'][i] || 'undefined'] = results?.[i];
    });

    return [tokenMap, useCallback((address?: string, tokenId?: string) => tokenMap?.[address || "undefined"]?.[tokenId || "undefined"], [tokenMap])];
}
