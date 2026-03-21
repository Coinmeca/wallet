import { queryOptions } from "@tanstack/react-query";
import { URLS, fetcher } from "./index";
import { query as erc20 } from "./erc20/query";
import { query as erc721 } from "./erc721/query";
import { query as onchain } from "./onchain/query";

export const query = {
    language: (code = "en") =>
        queryOptions({
            queryKey: ["language", code],
            queryFn: async () => await fetcher.json(`${URLS.PROXY.LANGUAGE}/${code}`),
            staleTime: 86400 * 1000,
        }),
    onchain,
    erc20,
    erc721,
};
