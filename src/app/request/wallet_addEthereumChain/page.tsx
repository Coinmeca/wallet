"use client";

import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { parseChainId } from "@coinmeca/wallet-provider/chains";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { Chain } from "@coinmeca/wallet-sdk/types";
import { useMessageHandler, useTelegram } from "hooks";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useState } from "react";

/*
await window.ethereum.providerMap.get("CoinmecaWallet").request({method:"wallet_addEthereumChain", params:[{
            chainId: '0x13e31',
            chainName: "Blast",
            rpcUrls: [
                "https://rpc.blast.io",
                "https://rpc.ankr.com/blast",
                "https://blast.din.dev/rpc",
                "https://blastl2-mainnet.public.blastapi.io",
                "https://blast.blockpi.network/v1/rpc/public",
                "https://blast.gasswap.org",
                "wss://blast.gasswap.org",
            ],
            blockExplorerUrls: ["https://blastscan.io"],
            nativeCurrency: {
                name: "Ethereum",
                symbol: "ETH",
                decimals: 18,
            }
        }]})
*/

const method = "wallet_addEthereumChain";
const timeout = 5000;

export default function Page() {
    const router = useRouter();

    const { telegram } = useTelegram();
    const { provider, chain } = useCoinmecaWalletProvider();
    const { isPopup, params, messageId } = useMessageHandler();

    const [selectedChain, setSelectedChain] = useState<any>();
    const [newChain, setNewChain] = useState<Chain>();

    const [level, setLevel] = useState(0);
    const [error, setError] = useState<any>();

    const result = () => {
        console.log("level:", level);
        window?.opener?.postMessage(
            {
                method,
                ...(level === 0 ? { error: "User rejected the request" } : { result: level === 1 ? true : newChain?.chainId }),
                id: messageId,
            },
            "*",
        );
    };

    const handleClose = () => {
        result();
        // if (isPopup) {
        if (telegram) telegram?.close();
        window?.close();
        // } else router.push("/");
    };

    const handleAddChain = async () => {
        if (!newChain) return;
        await provider
            ?.addEthereumChain(newChain)
            .then(() => setLevel(1))
            .catch((error) => {
                console.log(error);
                window?.opener?.postMessage(
                    {
                        method,
                        error,
                        id: messageId,
                    },
                    "*",
                );
                setError(error);
                setLevel(3);
            });
    };

    const handleSwitchChain = async () => {
        if (!newChain) return;
        await provider
            ?.switchEthereumChain(newChain?.chainId)
            .then((result) => {
                window?.opener?.postMessage(
                    {
                        method,
                        result,
                        id: messageId,
                    },
                    "*",
                );
                setLevel(2);
                setTimeout(handleClose, timeout);
            })
            .catch((error) => {
                console.log(error);
                window?.opener?.postMessage(
                    {
                        method,
                        error,
                        id: messageId,
                    },
                    "*",
                );
                setError(error);
                setLevel(3);
            });
    };

    useLayoutEffect(() => {
        console.log({ params });
        setSelectedChain(chain);
        if (params) {
            const { chainId, chainName, rpcUrls, nativeCurrency } = params;
            if (
                chainId &&
                chainName &&
                nativeCurrency &&
                nativeCurrency?.name &&
                nativeCurrency.symbol &&
                nativeCurrency.decimals &&
                rpcUrls &&
                rpcUrls.length > 0
            )
                setNewChain({ ...params, chainId: parseChainId(chainId) } as Chain);
        }
    }, []);

    useLayoutEffect(() => {
        window.addEventListener("beforeunload", result);
        return () => {
            window.removeEventListener("beforeunload", result);
        };
    }, [level]);

    return newChain ? (
        <Layouts.Contents.SlideContainer
            contents={[
                {
                    active: level === 0,
                    children: (
                        <Layouts.Contents.InnerContent scroll={false}>
                            <Layouts.Col gap={2} align={"center"} fill>
                                <Layouts.Contents.InnerContent padding={[4, 4, 0]}>
                                    <Layouts.Col fill>
                                        <Layouts.Col align={"center"} style={{ flex: 1 }}>
                                            <Layouts.Col gap={8} align={"center"} fit>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        maxWidth: "max-content",
                                                        maxHeight: "max-content",
                                                        padding: "2em",
                                                        borderRadius: "100%",
                                                        background: "rgba(var(--white),.15)",
                                                    }}>
                                                    <Image
                                                        width={0}
                                                        height={0}
                                                        src={newChain?.logo || `https://web3.coinmeca.net/${newChain.chainId}/logo.svg`}
                                                        alt={newChain?.chainName || ""}
                                                        style={{ width: "8em", height: "8em", borderRadius: "100%" }}
                                                    />
                                                </div>
                                                <Layouts.Col gap={1}>
                                                    <Elements.Text type={"h6"}>{newChain?.chainName}</Elements.Text>
                                                    <Elements.Text type={"strong"} opacity={0.6}>
                                                        {newChain?.chainId}
                                                    </Elements.Text>
                                                </Layouts.Col>
                                            </Layouts.Col>
                                        </Layouts.Col>
                                        <Layouts.Col gap={8} style={{ flex: 1 }} fill>
                                            <Layouts.Col reverse fill>
                                                <Layouts.Box
                                                    style={{
                                                        "--white": "255,255,255",
                                                        "--black": "0, 0, 0",
                                                        background: "rgba(var(--white),.15)",
                                                        maxHeight: "max-content",
                                                        padding: "clamp(2em, 7.5%, 4em)",
                                                        width: "auto",
                                                        height: "auto",
                                                    }}
                                                    fit>
                                                    <Layouts.Col gap={2} align={"left"}>
                                                        <Layouts.Col gap={0.5}>
                                                            <Elements.Text type={"desc"} weight={"bold"}>
                                                                <Elements.Text size={1} opacity={0.6}>
                                                                    Chain RPC URL
                                                                </Elements.Text>
                                                                {newChain.rpcUrls.length > 0 && (
                                                                    <>
                                                                        <Elements.Text size={1} opacity={0.6}>
                                                                            s
                                                                        </Elements.Text>{" "}
                                                                        <Elements.Text size={1} opacity={1}>
                                                                            +{newChain.rpcUrls.length}
                                                                        </Elements.Text>
                                                                    </>
                                                                )}
                                                            </Elements.Text>
                                                            <Elements.Text>{newChain.rpcUrls[0]}</Elements.Text>
                                                        </Layouts.Col>
                                                        <Layouts.Col gap={0.5}>
                                                            <Elements.Text type={"desc"} weight={"bold"} opacity={0.6}>
                                                                Native Currency Name
                                                            </Elements.Text>
                                                            <Elements.Text>{newChain.nativeCurrency?.name}</Elements.Text>
                                                        </Layouts.Col>
                                                        <Layouts.Col gap={0.5}>
                                                            <Elements.Text type={"desc"} weight={"bold"} opacity={0.6}>
                                                                Native Currency Symbol
                                                            </Elements.Text>
                                                            <Elements.Text>{newChain.nativeCurrency.symbol}</Elements.Text>
                                                        </Layouts.Col>
                                                        <Layouts.Col gap={0.5}>
                                                            <Elements.Text type={"desc"} weight={"bold"} opacity={0.6}>
                                                                Native Currency Decimals
                                                            </Elements.Text>
                                                            <Elements.Text>{newChain.nativeCurrency.decimals}</Elements.Text>
                                                        </Layouts.Col>
                                                    </Layouts.Col>
                                                </Layouts.Box>
                                            </Layouts.Col>
                                        </Layouts.Col>
                                    </Layouts.Col>
                                </Layouts.Contents.InnerContent>
                                <Layouts.Col gap={4} align={"center"} style={{ padding: "4em", paddingTop: 0 }}>
                                    <Layouts.Row gap={2}>
                                        <Controls.Button onClick={handleClose}>Cancel</Controls.Button>
                                        <Controls.Button type={"line"} onClick={handleAddChain}>
                                            Approve
                                        </Controls.Button>
                                    </Layouts.Row>
                                </Layouts.Col>
                            </Layouts.Col>
                        </Layouts.Contents.InnerContent>
                    ),
                },
                {
                    active: level === 1,
                    children: (
                        <Layouts.Col gap={2} align={"center"} fill>
                            <Layouts.Contents.InnerContent padding={[4, 4, 0]}>
                                <Layouts.Col fill>
                                    <Layouts.Col align={"center"} style={{ flex: 1 }}>
                                        <Layouts.Col gap={6} fit>
                                            <Layouts.Row gap={3} align={"center"} fix>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        maxWidth: "max-content",
                                                        maxHeight: "max-content",
                                                        padding: "2em",
                                                        borderRadius: "100%",
                                                        background: "rgba(var(--white),.15)",
                                                    }}>
                                                    <Image
                                                        src={selectedChain?.logo || `https://web3.coinmeca.net/${selectedChain?.chainId}/logo.svg`}
                                                        width={0}
                                                        height={0}
                                                        alt={selectedChain?.chainName || ""}
                                                        style={{ width: "4em", height: "4em", borderRadius: "100%" }}
                                                    />
                                                </div>
                                                <Layouts.Col gap={0} align={"center"} fill>
                                                    <Elements.Text type={"h6"} height={0} align={"left"}>
                                                        {selectedChain?.chainName}
                                                    </Elements.Text>
                                                    <Elements.Text type={"strong"} height={0} align={"left"} opacity={0.6}>
                                                        {selectedChain?.chainId}
                                                    </Elements.Text>
                                                </Layouts.Col>
                                            </Layouts.Row>
                                            <Layouts.Divider>
                                                <Elements.Icon icon={"chevron-down"} />
                                            </Layouts.Divider>
                                            <Layouts.Row gap={3} align={"center"} fix>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        maxWidth: "max-content",
                                                        maxHeight: "max-content",
                                                        padding: "2em",
                                                        borderRadius: "100%",
                                                        background: "rgba(var(--white),.15)",
                                                    }}>
                                                    <Image
                                                        src={newChain?.logo || `https://web3.coinmeca.net/${newChain?.chainId}/logo.svg`}
                                                        width={0}
                                                        height={0}
                                                        alt={newChain?.chainName || ""}
                                                        style={{ width: "4em", height: "4em", borderRadius: "100%" }}
                                                    />
                                                </div>
                                                <Layouts.Col gap={0} align={"center"}>
                                                    <Elements.Text type={"h6"} height={0} align={"left"}>
                                                        {newChain?.chainName}
                                                    </Elements.Text>
                                                    <Elements.Text type={"strong"} height={0} align={"left"} opacity={0.6}>
                                                        {newChain?.chainId}
                                                    </Elements.Text>
                                                </Layouts.Col>
                                            </Layouts.Row>
                                        </Layouts.Col>
                                    </Layouts.Col>
                                    <Layouts.Col gap={8} align={"center"} style={{ flex: 1 }} fill>
                                        <Layouts.Col gap={4} align={"center"} fit>
                                            <Elements.Text type={"h3"}>Switch</Elements.Text>
                                            <Elements.Text size={1} weight={"bold"}>
                                                <Elements.Text opacity={0.6}>This is will switch the chain from </Elements.Text>{" "}
                                                {/* <Elements.Text>{chain?.chainName}</Elements.Text> <Elements.Text opacity={0.6}>to</Elements.Text>{" "} */}
                                                <Elements.Text>{` ${newChain?.chainName}`}</Elements.Text>
                                                <Elements.Text opacity={0.6}>.</Elements.Text>
                                            </Elements.Text>
                                        </Layouts.Col>
                                    </Layouts.Col>
                                </Layouts.Col>
                            </Layouts.Contents.InnerContent>
                            <Layouts.Col gap={4} align={"center"} style={{ padding: "4em", paddingTop: 0 }}>
                                <Layouts.Row gap={2}>
                                    <Controls.Button type={"glass"} onClick={handleClose}>
                                        Close
                                    </Controls.Button>
                                    <Controls.Button type={"line"} onClick={handleSwitchChain}>
                                        Switch Chain
                                    </Controls.Button>
                                </Layouts.Row>
                            </Layouts.Col>
                        </Layouts.Col>
                    ),
                },
                {
                    active: level === 2,
                    children: (
                        <Layouts.Contents.InnerContent scroll={false}>
                            <Layouts.Col gap={2} align={"center"} fill>
                                <Layouts.Contents.InnerContent padding={[4, 4, 0]}>
                                    <Layouts.Col fill>
                                        <Layouts.Col align={"center"} style={{ flex: 1 }}>
                                            <Layouts.Col gap={8} align={"center"} fit>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        maxWidth: "max-content",
                                                        maxHeight: "max-content",
                                                        padding: "1em",
                                                        borderRadius: "100%",
                                                        background: "rgba(var(--white),.15)",
                                                    }}>
                                                    <Image
                                                        src={require("../../../assets/animation/success.gif")}
                                                        width={0}
                                                        height={0}
                                                        alt={newChain.chainName || ""}
                                                        style={{ width: "12em", height: "12em", borderRadius: "100%" }}
                                                    />
                                                </div>
                                                <Layouts.Col gap={0} align={"center"}>
                                                    <Elements.Text type={"h6"} height={0}>
                                                        {newChain?.chainName}
                                                    </Elements.Text>
                                                    <Elements.Text type={"strong"} height={0} opacity={0.6}>
                                                        {newChain?.chainId}
                                                    </Elements.Text>
                                                </Layouts.Col>
                                            </Layouts.Col>
                                        </Layouts.Col>
                                        <Layouts.Col gap={8} align={"center"} style={{ flex: 1 }} fill>
                                            <Layouts.Col align={"center"} style={{ padding: "4em" }}>
                                                <Layouts.Col gap={4} align={"center"} fit>
                                                    <Elements.Text type={"h3"}>Complete</Elements.Text>
                                                    <Elements.Text size={1} weight={"bold"}>
                                                        <Elements.Text opacity={0.6}>Selected chain was switched from</Elements.Text>{" "}
                                                        <Elements.Text>{selectedChain?.chainName}</Elements.Text>{" "}
                                                        <Elements.Text opacity={0.6}>to</Elements.Text>{" "}
                                                        <Elements.Text>{` ${newChain?.chainName}`}</Elements.Text>
                                                        <Elements.Text opacity={0.6}>.</Elements.Text>
                                                    </Elements.Text>
                                                </Layouts.Col>
                                            </Layouts.Col>
                                        </Layouts.Col>
                                    </Layouts.Col>
                                </Layouts.Contents.InnerContent>
                                <Layouts.Col gap={4} align={"center"} style={{ padding: "4em", paddingTop: 0 }}>
                                    <Layouts.Row gap={2}>
                                        <Controls.Button type={"glass"} onClick={handleClose}>
                                            Close
                                        </Controls.Button>
                                    </Layouts.Row>
                                </Layouts.Col>
                            </Layouts.Col>
                        </Layouts.Contents.InnerContent>
                    ),
                },
                {
                    active: level === 3,
                    children: (
                        <Layouts.Contents.InnerContent scroll={false}>
                            <Layouts.Col gap={2} align={"center"} fill>
                                <Layouts.Contents.InnerContent padding={[4, 4, 0]}>
                                    <Layouts.Col fill>
                                        <Layouts.Col align={"center"} style={{ flex: 1 }}>
                                            <Layouts.Col gap={8} align={"center"} fit>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        maxWidth: "max-content",
                                                        maxHeight: "max-content",
                                                        padding: "1em",
                                                        borderRadius: "100%",
                                                        background: "rgba(var(--white),.15)",
                                                    }}>
                                                    <Image
                                                        src={require("../../../assets/animation/failure.gif")}
                                                        width={0}
                                                        height={0}
                                                        alt={newChain.chainName || ""}
                                                        style={{ width: "12em", height: "12em", borderRadius: "100%" }}
                                                    />
                                                </div>
                                                <Layouts.Col gap={0} align={"center"}>
                                                    <Elements.Text type={"h6"} height={0}>
                                                        {newChain?.chainName}
                                                    </Elements.Text>
                                                    <Elements.Text type={"strong"} height={0} opacity={0.6}>
                                                        {newChain?.chainId}
                                                    </Elements.Text>
                                                </Layouts.Col>
                                            </Layouts.Col>
                                        </Layouts.Col>
                                        <Layouts.Col gap={8} align={"center"} style={{ flex: 1 }} fill>
                                            <Layouts.Col align={"center"} style={{ padding: "4em" }}>
                                                <Layouts.Col gap={4} align={"center"} fit>
                                                    <Elements.Text type={"h3"}>Failure</Elements.Text>
                                                    <Elements.Text weight={"bold"} opacity={0.6}>
                                                        {error?.message || error}
                                                    </Elements.Text>
                                                </Layouts.Col>
                                            </Layouts.Col>
                                        </Layouts.Col>
                                    </Layouts.Col>
                                </Layouts.Contents.InnerContent>
                                <Layouts.Col gap={4} align={"center"} style={{ padding: "4em", paddingTop: 0 }}>
                                    <Layouts.Row gap={2}>
                                        <Controls.Button type={"glass"} onClick={handleClose}>
                                            Close
                                        </Controls.Button>
                                    </Layouts.Row>
                                </Layouts.Col>
                            </Layouts.Col>
                        </Layouts.Contents.InnerContent>
                    ),
                },
            ]}
        />
    ) : (
        <Layouts.Contents.InnerContent scroll={false}>
            <Layouts.Col align={"center"} style={{ padding: "4em" }} fill>
                <Layouts.Col gap={4} align={"center"} style={{ flex: 1 }} fill>
                    <Layouts.Col gap={4} align={"center"} fill>
                        <Layouts.Col gap={8} align={"center"} fit>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    maxWidth: "max-content",
                                    maxHeight: "max-content",
                                    padding: "2em",
                                    borderRadius: "100%",
                                    background: "rgba(var(--white),.15)",
                                }}>
                                <Image
                                    width={0}
                                    height={0}
                                    src={require("../../../assets/animation/failure.gif")}
                                    alt={"Unknown"}
                                    style={{ width: "8em", height: "8em" }}
                                />
                            </div>
                        </Layouts.Col>
                    </Layouts.Col>
                </Layouts.Col>
                <Layouts.Col gap={0} align={"center"} style={{ flex: 1 }} fill>
                    <Layouts.Col align={"center"} style={{ flex: 1 }} fill>
                        <Layouts.Col gap={4} align={"center"} fit>
                            <Elements.Text type={"h3"}>Invalid Request</Elements.Text>
                            <Elements.Text weight={"bold"} opacity={0.6}>
                                {"The given chain information is something wrong. Couldn't found the information of requested chain."}
                            </Elements.Text>
                        </Layouts.Col>
                    </Layouts.Col>
                    <Layouts.Row gap={2}>
                        <Controls.Button type={"glass"} onClick={handleClose}>
                            Close
                        </Controls.Button>
                    </Layouts.Row>
                </Layouts.Col>
            </Layouts.Col>
        </Layouts.Contents.InnerContent>
    );
}
