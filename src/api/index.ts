import { getQueryClient } from "./client";
// import { prefetch } from "./prefetch";
// import * as schema from "./schema";

const URLS = {
    PROXY: {
        LANGUAGE: "/api/language",
    },
    LANGUAGE: process.env.LANG_URL,
};

const fetcher = {
    url: async (url: string, option?: RequestInit): Promise<Response | undefined> => {
        try {
            return await fetch(new URL(url.startsWith("http") ? url : `${window.location.origin}${url}`), option);
        } catch (error) {
            console.error("Error fetching URL:", url, error);
            throw error;
        }
    },
    json: async <T>(url: string, option?: RequestInit): Promise<T> => {
        try {
            const response = await fetcher.url(url, option);
            if (response?.ok) return response.json() as T;
            return undefined as T;
        } catch (error) {
            console.error("Error fetching JSON:", url, error);
            throw error;
        }
    },
    rpc: async (rpc: string, method: string, params?: any): Promise<any> => {
        try {
            const response = await fetch(new URL(rpc), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    id: `${method}-${new Date().getTime()}`,
                    method,
                    params,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.result) {
                    return data.result; // Return the actual result from the RPC response
                } else {
                    const error = (data?.error as any)?.message || "RPC response did not contain a result.";
                    console.error("RPC Error:", error);
                    throw new Error(error); // Improved error handling with the error message
                }
            } else {
                throw new Error(`RPC Error: ${response.statusText}`);
            }
        } catch (error) {
            console.error("Error fetching RPC data:", rpc, error);
            return null; // Return a fallback value to prevent undefined
        }
    },
};

export { URLS, getQueryClient, fetcher };
