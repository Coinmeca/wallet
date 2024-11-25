import { queryOptions } from "@tanstack/react-query";
import { fetcher } from "api";
import { hex } from "utils";

export const query = {
    token: (rpc?: string, erc20?: string, owner?: string) =>
        queryOptions({
            queryKey: [`${erc20}_token`, rpc, erc20, owner],
            queryFn: async () => {
                const [name, symbol, decimals, balance] = await Promise.allSettled([
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

                const d = decimals.status === "fulfilled" ? Number(decimals.value.toString()) : null;
                const b = balance && balance.status === "fulfilled" ? Number(balance.value.toString()) : null;

                return {
                    address: erc20,
                    name: name.status === "fulfilled" ? hex.toString(name.value.toString().slice(66)) : null,
                    symbol: symbol.status === "fulfilled" ? hex.toString(symbol.value.toString().slice(66)) : null,
                    decimals: (d && !isNaN(d)) ? d : null,
                    balance: (d && !isNaN(d) && b) ? b / (10 ** d) : null,
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
            ]).then((result) => hex.toString(result?.toString().slice(66))),
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
            ]).then((result) => hex.toString(result?.toString().slice(66))),
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
            ]).then((result) => hex.toNumber(result.toString())),
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
            ]).then((result) => hex.toNumber(result.toString())),
            enabled: !!rpc && !!erc20 && !!owner,
        }),
};
