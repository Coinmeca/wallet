import { queryOptions } from "@tanstack/react-query";
import { fetcher } from "api";
import { decodeHexToNumber, decodeHexToString } from "utils";

export const query = {
    token: (rpc?: string, erc20?: string, owner?: string) =>
        queryOptions({
            queryKey: [`${erc20}_token`, rpc, erc20, owner],
            queryFn: async () => {
                const [nameResult, symbolResult, decimalsResult, balanceResult] = await Promise.allSettled([
                    fetcher.rpc(rpc!, "eth_call", [
                        {
                            to: erc20,
                            data: "0x06fdde03" // `name()`
                        },
                        "latest",
                    ]),
                    fetcher.rpc(rpc!, "eth_call", [
                        {
                            to: erc20,
                            data: "0x95d89b41" // `symbol()`
                        },
                        "latest",
                    ]),
                    fetcher.rpc(rpc!, "eth_call", [
                        {
                            to: erc20,
                            data: "0x313ce567" // `decimals()`
                        },
                        "latest",
                    ]),
                    owner ? fetcher.rpc(rpc!, "eth_call", [
                        {
                            to: erc20,
                            data: `0x70a08231000000000000000000000000${owner.slice(2)}` // `balanceOf(address)`
                        },
                        "latest",
                    ]) : Promise.resolve(undefined),
                ]);

                // Decode values
                const decodeHexToString = (hex: string) => {
                    let str = '';
                    for (let i = 0; i < hex.length; i += 2) {
                        const charCode = parseInt(hex.substr(i, 2), 16);
                        if (charCode >= 32 && charCode <= 126) {
                            str += String.fromCharCode(charCode);
                        }
                    }
                    return str;
                };

                const decodeHexToNumber = (hex: string) => parseInt(hex, 16);

                return {
                    name: nameResult.status === "fulfilled" ? decodeHexToString(nameResult.value.toString().slice(66)) : null,
                    symbol: symbolResult.status === "fulfilled" ? decodeHexToString(symbolResult.value.toString().slice(66)) : null,
                    decimals: decimalsResult.status === "fulfilled" ? decodeHexToNumber(decimalsResult.value.toString()) : null,
                    balance: balanceResult && balanceResult.status === "fulfilled" ? decodeHexToNumber(balanceResult.value.toString()) : null,
                };
            },
            enabled: !!rpc && !!erc20,
        }),

    name: (rpc?: string, erc20?: any) =>
        queryOptions({
            queryKey: [`${erc20}_name`, 'name', rpc, erc20],
            queryFn: async () => fetcher.rpc(rpc!, "eth_call", [
                {
                    to: erc20,
                    data: "0x06fdde03" // `name()`
                },
                "latest",
            ]).then((result) => decodeHexToString(result?.toString().slice(66))),
            enabled: !!rpc && !!erc20,
        }),

    symbol: (rpc?: string, erc20?: any) =>
        queryOptions({
            queryKey: [`${erc20}_symbol`, 'symbol', rpc, erc20],
            queryFn: async () => fetcher.rpc(rpc!, "eth_call", [
                {
                    to: erc20,
                    data: "0x95d89b41" // `symbol()`
                },
                "latest",
            ]).then((result) => decodeHexToString(result?.toString().slice(66))),
            enabled: !!rpc && !!erc20,
        }),

    decimals: (rpc?: string, erc20?: string) =>
        queryOptions({
            queryKey: [`${erc20}_decimals`, 'decimals', rpc, erc20],
            queryFn: async () => fetcher.rpc(rpc!, "eth_call", [
                {
                    to: erc20,
                    data: "0x313ce567" // `decimals()`
                },
                "latest",
            ]).then((result) => decodeHexToNumber(result.toString())),
            enabled: !!rpc && !!erc20,
        }),

    balanceOf: (rpc?: string, erc20?: string, owner?: string) =>
        queryOptions({
            queryKey: [`${erc20}_balanceOf`, 'balanceOf', rpc, erc20, owner],
            queryFn: async () => fetcher.rpc(rpc!, "eth_call", [
                {
                    to: erc20,
                    data: `0x70a08231000000000000000000000000${owner?.slice(2)}` // `balanceOf(address)` selector
                },
                "latest",
            ]).then((result) => decodeHexToNumber(result.toString())),
            enabled: !!rpc && !!erc20 && !!owner,
        }),
};
