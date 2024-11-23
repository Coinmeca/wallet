import { queryOptions } from "@tanstack/react-query";
import { fetcher } from "api";
import { decodeHexToString, isVideo } from "utils";

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

                const hexToBytes = (hex: string) => {
                    const bytes: number[] = [];
                    // Ensure the input string is valid hex by removing non-hex characters (if any)
                    const cleanHex = hex.replace(/[^0-9A-Fa-f]/g, '');  // Remove non-hex characters
                    for (let i = 0; i < cleanHex.length; i += 2) {
                        const byte = parseInt(cleanHex.substring(i, 2), 16);
                        if (!isNaN(byte)) {
                            bytes.push(byte);
                        }
                    }
                    return bytes;
                };

                console.log(123);
                const decodeBase64StringFromHex = (hex: string) => {
                    console.log(1);
                    // Remove '0x' if present at the start of the hex string
                    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;

                    console.log(2);
                    // Convert hex to a byte array
                    const uriBytes = hexToBytes(cleanHex);

                    console.log(3);
                    // Convert byte array to string
                    const uriString = String.fromCharCode.apply(null, uriBytes);

                    console.log(4);
                    // Now, uriString should contain a string like "data:application/json;base64,<base64Data>"
                    // Find the actual base64-encoded string after 'data:application/json;base64,'
                    const base64Prefix = "data:application/json;base64,";
                    if (uriString.startsWith(base64Prefix)) {
                        const base64Data = uriString.slice(base64Prefix.length);
                        return `data:application/json;base64,${base64Data}`;
                    }

                    console.log(5, { base64Prefix, uriString });
                    // If the format doesn't match, return an error or handle it as needed
                    throw new Error("Invalid format: The URI does not have the expected 'data:application/json;base64,' prefix");
                }


                const base64String = decodeBase64StringFromHex(tokenURI?.status === "fulfilled" ? tokenURI?.value?.toString()?.slice(66) : '');

                console.log(base64String);

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
