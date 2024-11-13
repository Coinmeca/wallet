import { queryOptions } from "@tanstack/react-query";
import { fetcher } from "api";

export const query = {
    token: (rpc?: string, erc20?: string, owner?: string) =>
        queryOptions({
            queryKey: ["tokenData", rpc, erc20, owner],
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

                return {
                    name: nameResult.status === "fulfilled" ? nameResult.value : null,
                    symbol: symbolResult.status === "fulfilled" ? symbolResult.value : null,
                    decimals: decimalsResult.status === "fulfilled" ? decimalsResult.value : null,
                    balance: balanceResult && balanceResult.status === "fulfilled" ? balanceResult.value : null,
                };
            },
            enabled: !!rpc && !!erc20,
        }),

    name: (rpc?: string, erc20?: any) =>
        queryOptions({
            queryKey: ["name", rpc, erc20],
            queryFn: async () => fetcher.rpc(rpc!, "eth_call", [
                {
                    to: erc20,
                    data: "0x06fdde03" // `name()`
                },
                "latest",
            ]),
            enabled: !!rpc && !!erc20,
        }),

    symbol: (rpc?: string, erc20?: any) =>
        queryOptions({
            queryKey: ["symbol", rpc, erc20],
            queryFn: async () => fetcher.rpc(rpc!, "eth_call", [
                {
                    to: erc20,
                    data: "0x95d89b41" // `symbol()`
                },
                "latest",
            ]),
            enabled: !!rpc && !!erc20,

        }),

    decimals: (rpc?: string, erc20?: string) =>
        queryOptions({
            queryKey: ["decimals", rpc, erc20],
            queryFn: async () => fetcher.rpc(rpc!, "eth_call", [
                {
                    to: erc20,
                    data: "0x313ce567" // `decimals()`
                },
                "latest",
            ]),
            enabled: !!rpc && !!erc20,
        }),
    balanceOf: (rpc?: string, erc20?: string, owner?: string) =>
        queryOptions({
            queryKey: ["balanceOf", rpc, erc20],
            queryFn: async () => fetcher.rpc(rpc!, "eth_call", [
                {
                    to: erc20,
                    data: `0x70a08231000000000000000000000000${owner?.slice(2)}` // `balanceOf(address)` selector
                },
                "latest",
            ]),
            enabled: !!rpc && !!erc20 && !!owner,
        }),

};