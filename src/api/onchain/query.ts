import { queryOptions } from "@tanstack/react-query";
import { fetcher } from "api";
import { sanitizeBigIntToHex, valid } from "utils";

export const query = {
    rpcUrls: () =>
        queryOptions({
            queryKey: ["rpcUrls"],
            queryFn: async () =>
                await fetcher.url("/api/v1/chains").then((data: any) => {
                    return data?.data?.map((chain: any) => ({
                        chainName: chain.name,
                        chainId: chain.chainId,
                        rpcUrl: [chain.rpc[0]],
                    }));
                }),
            staleTime: 10 * 60 * 1000,
        }),

    typeOf: (rpc?: string, address?: string) =>
        queryOptions({
            queryKey: ["accountType", address],
            queryFn: async () => (await fetcher.rpc(rpc!, "eth_getCode", [address, "latest"]).then(data => data === "0x" ? "eoa" : "ca")),
            enabled: !!rpc && valid.address(address),
        }),

    balance: (rpc?: string, address?: string) =>
        queryOptions({
            queryKey: ["balance", rpc, address],
            queryFn: async () => await fetcher.rpc(rpc!, "eth_getBalance", [address, "latest"]).then(data => (data ? Number(data) / 1e18 : 0)),
            enabled: !!rpc && valid.address(address),
        }),

    nonce: (rpc?: string, address?: string) =>
        queryOptions({
            queryKey: ["nonce", rpc, address],
            queryFn: async () => await fetcher.rpc(rpc!, "eth_getTransactionCount", [address, "pending"]).then(data => Number(data || 0)),
            enabled: !!rpc && valid.address(address),
        }),

    gasPrice: (rpc?: string) =>
        queryOptions({
            queryKey: ["gasPrice", rpc],
            queryFn: async () =>
                await fetcher.rpc(rpc!, "eth_gasPrice").then(data => ({
                    raw: Number(data || 0),
                    format: data ? Number(data) / 1e9 : 0,
                })),
            enabled: !!rpc,
        }),

    estimateGas: (rpc?: string, params?: any) =>
        queryOptions({
            queryKey: ["estimateGas", rpc, params],
            queryFn: async () => await fetcher.rpc(rpc!, "eth_estimateGas", sanitizeBigIntToHex(Array.isArray(params) ? params : [params])).then(data => ({
                raw: Number(data || 0),
                format: data ? Number(data) / 1e9 : 0,
            })),
            enabled: !!rpc && valid.tx(params),
        }),

    lastBlock: (rpc?: string) =>
        queryOptions({
            queryKey: ["lastBlock", rpc],
            queryFn: async () => await fetcher.rpc(rpc!, "eth_getBlockByNumber", ["latest", false]),
            enabled: !!rpc,
        }),

    maxPriorityFeePerGas: (rpc?: string) =>
        queryOptions({
            queryKey: ["maxPriorityFeePerGas", rpc],
            queryFn: async () =>
                await fetcher.rpc(rpc!, "eth_maxPriorityFeePerGas").then(data => ({
                    raw: Number(data || 0),
                    format: data ? Number(data) / 1e9 : 0,
                })),
            enabled: !!rpc,
        }),

    receipt: (rpc?: string, txHash?: string) =>
        queryOptions({
            queryKey: ["receipt", rpc, txHash],
            queryFn: async () => await fetcher.rpc(rpc!, "eth_getTransactionReceipt", [txHash]).then(data => data),
            enabled: !!rpc && !!txHash,
        }),
};
