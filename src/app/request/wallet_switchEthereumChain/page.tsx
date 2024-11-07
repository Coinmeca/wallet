"use client";

import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { usePopupChecker, useTelegram } from "hooks";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { parseChainId } from "utils";
import { Chain } from "@coinmeca/wallet-sdk/src";

/*
await window.ethereum.providerMap.get("CoinmecaWallet").request({method:"wallet_addEthereumChain", params:[{chainId: '0x13e31'}]})
*/

export default function wallet_switchEthereumChain({ params }: { params: any }) {
    const method = "wallet_switchEthereumChain";
    const router = useRouter();

    const { telegram } = useTelegram();
    const { isPopup } = usePopupChecker();
    // const { storage, session } = useStorage();
    // const { chain, setChain } = useAccount();

    const [selectedChain, setSelectedChain] = useState<any>();
    const [newChain, setNewChain] = useState<Chain>();
    const [level, setLevel] = useState(0);

    useLayoutEffect(() => {
        // setSelectedChain(chain);
        // if ((window as any)?.coinmeca) {
        //     const params = (window as any)?.coinmeca?.params?.chainId || (window as any)?.coinmeca?.params?.id;
        //     if (params) {
        //         const chainId = parseChainId(params);
        //         const chains = session?.get(`${session?.get("key")}:chains`);
        //         const exist = chains?.find((c: any) => c?.id === chainId);
        //         if (exist)
        //             setNewChain({
        //                 chainId: exist?.id,
        //                 chainName: exist?.name,
        //                 rpcUrls: exist?.rpc,
        //                 blockExplorerUrls: exist?.explorer,
        //                 nativeCurrency: exist?.nativeCurrency,
        //             });
        //     }
        // }
    }, []);

    const handleClose = () => {
        if (isPopup) {
            if (telegram) telegram?.close();
            window?.close();
        } else router.push("/");
        if (level < 2)
            window?.opener?.postMessage(
                {
                    method,
                    ...(level === 0 ? { error: "User rejected the request" } : {}),
                },
                "*",
            );
    };

    const handleSwitchChain = () => {
        if (!newChain) return;
        // setChain(
        //     typeof newChain?.chainId === "string"
        //         ? newChain?.chainId?.startsWith("0x")
        //             ? parseChainId(newChain?.chainId)
        //             : parseInt(newChain?.chainId)
        //         : newChain?.chainId,
        // );
        window?.opener?.postMessage(
            {
                method,
                result: newChain,
            },
            "*",
        );
        setLevel(2);
    };

    return newChain ? (
        <Layouts.Contents.SlideContainer
            contents={[
                {
                    active: level === 0,
                    children: (
                        <Layouts.Contents.InnerContent scroll={false}>
                            <Layouts.Col align={"center"} style={{ padding: "4em" }} fill>
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
                                                    src={`https://web3.coinmeca.net/${selectedChain?.id}/logo.svg`}
                                                    width={0}
                                                    height={0}
                                                    alt={selectedChain.chainName || ""}
                                                    style={{ width: "4em", height: "4em" }}
                                                />
                                            </div>
                                            <Layouts.Col gap={0} align={"center"} fill>
                                                <Elements.Text type={"h6"} height={0} align={"left"}>
                                                    {selectedChain?.name}
                                                </Elements.Text>
                                                <Elements.Text type={"strong"} height={0} align={"left"} opacity={0.6}>
                                                    {selectedChain?.id}
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
                                                    src={`https://web3.coinmeca.net/${newChain?.chainId}/logo.svg`}
                                                    width={0}
                                                    height={0}
                                                    alt={newChain.chainName || ""}
                                                    style={{ width: "4em", height: "4em" }}
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
                                <Layouts.Col gap={0} align={"center"} style={{ flex: 1 }} fill>
                                    <Layouts.Col align={"center"} style={{ padding: "4em" }}>
                                        <Layouts.Col gap={4} align={"center"} fit>
                                            <Elements.Text type={"h3"}>Switch</Elements.Text>
                                            <Elements.Text size={1} weight={"bold"}>
                                                <Elements.Text opacity={0.6}>This is will switch the chain from </Elements.Text>{" "}
                                                {/* <Elements.Text>{chain?.name}</Elements.Text> <Elements.Text opacity={0.6}>to</Elements.Text>{" "} */}
                                                <Elements.Text>{` ${newChain?.chainName}`}</Elements.Text>
                                                <Elements.Text opacity={0.6}>.</Elements.Text>
                                            </Elements.Text>
                                        </Layouts.Col>
                                    </Layouts.Col>
                                    <Layouts.Col gap={4} align={"center"} style={{ margin: 0 }} fit>
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
                            </Layouts.Col>
                        </Layouts.Contents.InnerContent>
                    ),
                },
                {
                    active: level === 1,
                    children: (
                        <Layouts.Contents.InnerContent scroll={false}>
                            <Layouts.Col align={"center"} style={{ padding: "4em" }} fill>
                                <Layouts.Col align={"center"} style={{ flex: 1 }}>
                                    <Layouts.Col fit>
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
                                                    style={{ width: "12em", height: "12em" }}
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
                                </Layouts.Col>
                                <Layouts.Col gap={0} align={"center"} style={{ flex: 1 }} fill>
                                    <Layouts.Col align={"center"} style={{ padding: "4em" }}>
                                        <Layouts.Col gap={4} align={"center"} fit>
                                            <Elements.Text type={"h3"}>Complete</Elements.Text>
                                            <Elements.Text size={1} weight={"bold"}>
                                                <Elements.Text opacity={0.6}>Selected chain was switched from</Elements.Text>{" "}
                                                <Elements.Text>{selectedChain?.name}</Elements.Text> <Elements.Text opacity={0.6}>to</Elements.Text>{" "}
                                                <Elements.Text>{` ${newChain?.chainName}`}</Elements.Text>
                                                <Elements.Text opacity={0.6}>.</Elements.Text>
                                            </Elements.Text>
                                        </Layouts.Col>
                                    </Layouts.Col>
                                    <Layouts.Col gap={4} align={"center"} style={{ margin: 0 }} fit>
                                        <Controls.Button type={"glass"} onClick={handleClose}>
                                            Close
                                        </Controls.Button>
                                    </Layouts.Col>
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
                                The given chain information is something wrong. Couldn't found the information of requested chain.
                            </Elements.Text>
                        </Layouts.Col>
                    </Layouts.Col>
                    <Layouts.Row gap={2}>
                        <Controls.Button type={"glass"} onClick={handleClose}>
                            Cancel
                        </Controls.Button>
                    </Layouts.Row>
                </Layouts.Col>
            </Layouts.Col>
        </Layouts.Contents.InnerContent>
    );
}
