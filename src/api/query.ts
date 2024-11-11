import { queryOptions } from "@tanstack/react-query";
import { fetcher } from "api";

export const query = {
    balance: (rpc?: string, address?: string) =>
        queryOptions({
            queryKey: ['eth_getBalance', address, rpc],
            queryFn: async () => fetcher.rpc(rpc!, "eth_getBalance", [address, "latest"]).then((result) => result ? Number(result) / 1e18 : 0),
            enabled: typeof rpc === "string" && typeof address === "string"
        }),
    gasPrice: (rpc?: string) =>
        queryOptions({
            queryKey: ['eth_gasPrice', rpc],
            queryFn: async () => await fetcher.rpc(rpc!, "eth_gasPrice").then((result) => result ? Number(result) / 1e18 : 0),
            enabled: typeof rpc === "string"
        }),

    estimateGas: (rpc?: string, params?: any) =>
        queryOptions({
            queryKey: ['eth_gasPrice', params],
            queryFn: async () => fetcher.rpc(rpc!, "eth_estimateGas", Array.isArray(params) ? params : [params]).then((result) => result ? Number(result) / 1e18 : 0),
            enabled: typeof rpc === "string"
        }),
};