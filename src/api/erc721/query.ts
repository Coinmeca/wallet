import { queryOptions } from "@tanstack/react-query";
import { fetcher } from "api";
import { hex, isVideo } from "utils";

export const query = {
    token: (rpc?: string, erc721?: string, tokenId?: string) =>
        queryOptions({
            queryKey: [`${erc721}_token`, rpc, erc721, tokenId],
            queryFn: async () => {

                const [tokenURI, ownerOf] = await Promise.allSettled([
                    fetcher.rpc(rpc!, "eth_call", [
                        {
                            to: erc721,
                            data: `0xc87b56dd${BigInt(tokenId!).toString(16).padStart(64, '0')}` // tokenURI(tokenId)
                        },
                        "latest",
                    ]),
                    fetcher.rpc(rpc!, "eth_call", [
                        {
                            to: erc721,
                            data: `0x6352211e${BigInt(tokenId!).toString(16).padStart(64, '0')}`
                        },
                        "latest",
                    ])
                ]);
                console.log({ tokenURI, ownerOf });

                try {

                    const test = tokenURI?.status === 'fulfilled' ? tokenURI?.value?.slice(3) : ''
                    console.log(test);
                    console.log(hex.toString(test));
                } catch (error) {
                    console.log({ error })
                }

                // Check if the URI needs further parsing or adjustment
                // let parsedTokenURI = null;
                // if (uri) {
                // try {
                // parsedTokenURI = JSON.parse(uri); // Assuming it's a JSON string
                // } catch (error) {
                // console.error('Failed to parse tokenURI JSON:', error);
                // }
                // }
                // 
                // Ensure that we have a valid parsed URI, otherwise fall back to using it directly
                // const validUri = parsedTokenURI?.tokenURI || uri;
                // 
                // console.log({ uri, parsedTokenURI, validUri });

                const owner = ownerOf?.status === "fulfilled" && ownerOf?.value?.length >= 66
                    ? `0x${ownerOf?.value?.toString()?.slice(-40)}`
                    : null;

                // Image handling from the URI
                let image = null;
                // if (validUri) {
                //     if (validUri.startsWith("data:image/")) image = validUri;
                //     else if (validUri.startsWith("ipfs://")) image = `https://ipfs.io/ipfs/${validUri.slice(7)}`;
                //     else if (validUri.startsWith("http") || validUri.startsWith("https")) image = validUri;
                // }

                return {
                    image,
                    tokenId,
                    address: erc721,
                    tokenURI: null,
                    owner,
                    isVideo: image && isVideo(image)
                };
            },
            enabled: !!rpc && !!erc721 && !!tokenId,
        }),

    ownerOf: (rpc?: string, erc721?: string, tokenId?: string) =>
        queryOptions({
            queryKey: [`${erc721}_ownerOf`, rpc, erc721, tokenId],
            queryFn: async () => await fetcher.rpc(rpc!, "eth_call", [
                {
                    to: erc721,
                    data: `0x6352211e${BigInt(tokenId!).toString(16).padStart(64, '0')}`
                },
                "latest",
            ]).then(data => (data && data?.length >= 66) && `0x${data?.toString()?.slice(-40)}`),
            enabled: !!rpc && !!erc721 && !!tokenId,
        })
};
