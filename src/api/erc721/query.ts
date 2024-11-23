import { queryOptions } from "@tanstack/react-query";
import { fetcher } from "api";
import { isVideo } from "utils";

export const query = {
    token: (rpc?: string, erc721?: string, tokenId?: string) =>
        queryOptions({
            queryKey: [`${erc721}_tokenURI`, rpc, erc721, tokenId],
            queryFn: async () => {
                const [tokenURI] = await Promise.race([
                    fetcher.rpc(rpc!, "eth_call", [
                        {
                            to: erc721,
                            data: `0xc87b56dd00000000000000000000000000000000000000000000000000000000${BigInt(tokenId!).toString(16).padStart(64, '0')}` // `tokenURI(tokenId)`
                        },
                        "latest",
                    ])
                ]);

                // Decode values (if necessary)
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

                const decodedTokenURI = tokenURI.status === "fulfilled" ? decodeHexToString(tokenURI.value.toString().slice(66)) : null;

                let image = null;

                if (decodedTokenURI) {
                    if (decodedTokenURI.startsWith("data:image/")) image = decodedTokenURI;
                    else if (decodedTokenURI.startsWith("ipfs://")) image = `https://ipfs.io/ipfs/${decodedTokenURI.slice(7)}`;
                    else if (decodedTokenURI.startsWith("http") || decodedTokenURI.startsWith("https")) image = decodedTokenURI;
                }

                return {
                    address: erc721,
                    tokenURI: decodedTokenURI,
                    image,
                    isVideo: image && isVideo(image)
                };
            },
            enabled: !!rpc && !!erc721 && !!tokenId,
        }),
};
