import { Address } from "@coinmeca/wallet-sdk/types";
import { queryOptions } from "@tanstack/react-query";
import { fetcher } from "api";
import { hex, valid } from "utils";

export const query = {
    token: (rpc?: string, erc20?: string, owner?: string) =>
        queryOptions({
            queryKey: [`${erc20}_token`, "erc20", rpc, erc20, owner],
            queryFn: async () => {
                const [name, symbol, decimals, balance] = await Promise.allSettled([
                    fetcher.rpc(rpc!, "eth_call", [
                        {
                            to: erc20,
                            data: "0x06fdde03", // `name()`
                        },
                        "latest",
                    ]),
                    fetcher.rpc(rpc!, "eth_call", [
                        {
                            to: erc20,
                            data: "0x95d89b41", // `symbol()`
                        },
                        "latest",
                    ]),
                    fetcher.rpc(rpc!, "eth_call", [
                        {
                            to: erc20,
                            data: "0x313ce567", // `decimals()`
                        },
                        "latest",
                    ]),
                    owner
                        ? fetcher.rpc(rpc!, "eth_call", [
                              {
                                  to: erc20,
                                  data: `0x70a08231000000000000000000000000${owner.slice(2)}`, // `balanceOf(address)`
                              },
                              "latest",
                          ])
                        : Promise.resolve(undefined),
                ]);

                if (name.status === "rejected" || symbol.status === "rejected" || decimals.status === "rejected")
                    return {
                        address: erc20,
                        isInvalid: true,
                        message: "Not a valid ERC20 token contract.",
                    };

                let token = {
                    name: name.status === "fulfilled" ? name.value.toString().slice(66) : undefined,
                    symbol: symbol.status === "fulfilled" ? symbol.value.toString().slice(66) : undefined,
                    decimals: decimals.status === "fulfilled" ? decimals.value.toString() : undefined,
                    balance: balance && balance.status === "fulfilled" ? balance.value.toString() : undefined,
                };

                if (!token?.name || token?.name === "0x" || !token?.symbol || token?.symbol === "0x" || !token?.decimals || token?.decimals === "0x")
                    return {
                        address: erc20,
                        isInvalid: true,
                        message: "Not a valid ERC20 token contract.",
                    };

                token = {
                    name: hex.toString(token.name),
                    symbol: hex.toString(token.symbol),
                    decimals: Number(token.decimals),
                    balance: Number(token.balance.toString()),
                };

                return {
                    ...token,
                    address: erc20,
                    decimals: !isNaN(token.decimals) ? token.decimals : 0,
                    balance: !isNaN(token.decimals) && !isNaN(token.balance) ? token.balance / 10 ** token.decimals : 0,
                };
            },
            enabled: !!rpc && valid.address(erc20),
        }),

    name: (rpc?: string, erc20?: any) =>
        queryOptions({
            queryKey: [`${erc20}_name`, "erc20", "name", rpc, erc20],
            queryFn: async () =>
                fetcher
                    .rpc(rpc!, "eth_call", [
                        {
                            to: erc20,
                            data: "0x06fdde03", // `name()`
                        },
                        "latest",
                    ])
                    .then((result) => hex.toString(result?.toString().slice(66))),
            enabled: !!rpc && valid.address(erc20),
        }),

    symbol: (rpc?: string, erc20?: any) =>
        queryOptions({
            queryKey: [`${erc20}_symbol`, "erc20", "symbol", rpc, erc20],
            queryFn: async () =>
                fetcher
                    .rpc(rpc!, "eth_call", [
                        {
                            to: erc20,
                            data: "0x95d89b41", // `symbol()`
                        },
                        "latest",
                    ])
                    .then((result) => hex.toString(result?.toString().slice(66))),
            enabled: !!rpc && valid.address(erc20),
        }),

    decimals: (rpc?: string, erc20?: string) =>
        queryOptions({
            queryKey: [`${erc20}_decimals`, "erc20", "decimals", rpc, erc20],
            queryFn: async () =>
                fetcher
                    .rpc(rpc!, "eth_call", [
                        {
                            to: erc20,
                            data: "0x313ce567", // `decimals()`
                        },
                        "latest",
                    ])
                    .then((result) => hex.toNumber(result.toString())),
            enabled: !!rpc && valid.address(erc20),
        }),

    balanceOf: (rpc?: string, erc20?: string, owner?: string) =>
        queryOptions({
            queryKey: [`${erc20}_balanceOf`, "erc20", "balanceOf", rpc, erc20, owner],
            queryFn: async () =>
                fetcher
                    .rpc(rpc!, "eth_call", [
                        {
                            to: erc20,
                            data: `0x70a08231000000000000000000000000${owner?.slice(2)}`, // `balanceOf(address)` selector
                        },
                        "latest",
                    ])
                    .then((result) => hex.toNumber(result.toString())),
            enabled: !!rpc && valid.address(erc20) && !!owner,
        }),
};
