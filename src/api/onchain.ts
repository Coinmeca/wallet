import { useQuery } from "@tanstack/react-query";
import { query } from "./query";

export function GetGasPrice(rpc?: string) {
    return useQuery(query.gasPrice(rpc))
}

export function GetEstimateGas(rpc?: string, params?: any) {
    return useQuery(query.estimateGas(rpc, params))
}
