import { queryOptions } from "@tanstack/react-query";
import { fetcher } from "api";
import { base64, hex, isVideo } from "utils";

export const query = {
    token: (rpc?: string, erc721?: string, tokenId?: string) =>
        queryOptions({
            queryKey: [`${erc721}_token`, rpc, erc721, tokenId],
            queryFn: async () => {
                try {


                    const [tokenURI, ownerOf] = await Promise.allSettled([
                        fetcher.rpc(rpc!, "eth_call", [
                            {
                                to: erc721,
                                data: '0xc87b56dd' + BigInt(tokenId!).toString(16).padStart(64, '0') // tokenURI(tokenId)
                            },
                            "latest",
                        ]),
                        fetcher.rpc(rpc!, "eth_call", [
                            {
                                to: erc721,
                                data: '0x6352211e' + BigInt(tokenId!).toString(16).padStart(64, '0') // ownerOf(tokenId)
                            },
                            "latest",
                        ])
                    ]);

                    console.log({ erc721, tokenId }, `0xc87b56dd${BigInt(tokenId!).toString(16).padStart(64, '0')}`)

                    let uri: Record<string, string | undefined> | undefined;
                    const metadata = tokenURI?.status === 'fulfilled' ? hex.toString(tokenURI?.value?.slice(66)) : undefined
                    if (metadata) {
                        if (metadata?.startsWith('http')) uri = await fetcher.json(metadata);
                        else if (metadata?.startsWith('data')) uri = base64.toJson(metadata);
                    }

                    let image = uri?.image;
                    if (image && image !== '') {
                        if (image?.startsWith("ipfs://")) image = `https://ipfs.io/ipfs/${image?.slice(7)}`;
                        // else if (image?.startsWith("http")) image = image;
                        // if (image?.startsWith("data:image/")) image = image;
                    }

                    console.log({ metadata, uri })

                    return {
                        uri,
                        image,
                        tokenId,
                        address: erc721,
                        isVideo: image && isVideo(image),
                        owner: ownerOf?.status === "fulfilled" && ownerOf?.value?.length >= 66 ? `0x${ownerOf?.value?.toString()?.slice(-40)}` : undefined,
                    };
                } catch {
                    return {
                        isInvalid: true,
                    }
                }
            },
            enabled: !!rpc && !!erc721 && !!tokenId,
        }),

    ownerOf: (rpc?: string, erc721?: string, tokenId?: string) =>
        queryOptions({
            queryKey: [`${erc721}_ownerOf`, rpc, erc721, tokenId],
            queryFn: async () => await fetcher.rpc(rpc!, "eth_call", [
                {
                    to: erc721,
                    data: '0x6352211e' + BigInt(tokenId!).toString(16).padStart(64, '0')
                },
                "latest",
            ]).then(data => (data && data?.length >= 66) && `0x${data?.toString()?.slice(-40)}`),
            enabled: !!rpc && !!erc721 && !!tokenId,
        })
};
