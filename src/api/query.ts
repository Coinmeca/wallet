import { query as erc20 } from "./erc20/query";
import { query as erc721 } from "./erc721/query";
import { query as onchain } from "./onchain/query";

export const query = {
    onchain,
    erc20,
    erc721,
};
