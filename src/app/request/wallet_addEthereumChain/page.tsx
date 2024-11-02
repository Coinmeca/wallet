"use client";

import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { useAccount, usePopupChecker, useStorage, useTelegram } from "hooks";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { parseChainId } from "utils";
import { Chain } from "wallet/provider";

/*
http://localhost:3000/request/wallet_addEthereumChain?chainId=421614&base=evm&chainName=Arbitrum+Sepolia&logo=https%3A%2F%2Fcoinmeca-web3.vercel.app%2F42161%2Flogo.svg&rpcUrls%5B%5D=https%3A%2F%2Fsepolia-rollup.arbitrum.io%2Frpc&rpc%5B%5D=https%3A%2F%2Farbitrum-sepolia.blockpi.network%2Fv1%2Frpc%2Fpublic&rpc%5B%5D=https%3A%2F%2Fendpoints.omniatech.io%2Fv1%2Farbitrum%2Fsepolia%2Fpublic&blockExplorerUrls%5B%5D=https%3A%2F%2Fsepolia.arbiscan.io%2F&nativeCurrency%5Bname%5D=Ethereum&nativeCurrency%5Bsymbol%5D=ETH&nativeCurrency%5Bdecimals%5D=18
http://localhost:3000/request/wallet_addEthereumChain?
*/

export default function wallet_addEthereumChain({ params }: { params: any }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const { telegram } = useTelegram();
    const { isPopup } = usePopupChecker();
    const { storage, session } = useStorage();
    const { chain, setChain } = useAccount();

    const [selectedChain, setSelectedChain] = useState<any>();
    const [newChain, setNewChain] = useState<Chain>();
    const [level, setLevel] = useState(0);

    useLayoutEffect(() => {
        const decimals = searchParams.get("nativeCurrency[decimals]");
        const c = {
            chainId: searchParams.get("chainId") || searchParams.get("id"),
            chainName: searchParams.get("chainName") || searchParams.get("name"),
            rpcUrls: searchParams.getAll("rpcUrls[]") || searchParams.getAll("rpc[]"),
            blockExplorerUrls: searchParams.getAll("blockExplorerUrls[]") || searchParams.getAll("explorer[]"),
            nativeCurrency: {
                name: searchParams.get("nativeCurrency[name]"),
                symbol: searchParams.get("nativeCurrency[symbol]"),
                decimals: decimals && decimals !== "" ? parseInt(decimals) : null,
            },
        };
        const { chainId, chainName, rpcUrls, nativeCurrency } = c;
        if (
            chainId &&
            chainName &&
            nativeCurrency &&
            nativeCurrency.name &&
            nativeCurrency.symbol &&
            nativeCurrency.decimals &&
            rpcUrls &&
            rpcUrls.length > 0
        ) {
            setSelectedChain(chain);
            setNewChain(c as Chain);
        }
    }, []);

    const handleClose = () => {
        if (telegram) telegram?.close();
        else if (isPopup) window?.close();
        else router.push("/");
    };

    const handleAddChain = () => {
        if (!newChain) return;

        const key = session?.get("key");
        const chains = storage?.get(`${key}:chains`) || [];

        if (chains) {
            if (chains?.find((c: any) => c?.id === newChain?.chainId)) chains.map((c: Chain) => (c?.chainId === newChain?.chainId ? newChain : c));
            else
                storage?.set(`${key}:chains`, [
                    ...chains,
                    {
                        id: newChain.chainId,
                        name: newChain.chainName,
                        nativeCurrency: newChain.nativeCurrency,
                        rpc: newChain.rpcUrls,
                        explorer: newChain.blockExplorerUrls,
                    },
                ]);
            setLevel(1);
        } else {
            // error
        }
    };

    const handleSwitchChain = () => {
        if (!newChain) return;
        // handleClose();
        setLevel(2);
        setChain(
            typeof newChain?.chainId === "string"
                ? newChain?.chainId?.startsWith("0x")
                    ? parseChainId(newChain?.chainId)
                    : parseInt(newChain?.chainId)
                : newChain?.chainId,
        );
    };

    return newChain ? (
        <Layouts.Contents.SlideContainer
            contents={[
                {
                    active: level === 0,
                    children: (
                        <Layouts.Contents.InnerContent scroll={false}>
                            <Layouts.Col align={"center"} style={{ padding: "4em" }} fill>
                                <Layouts.Col gap={4} align={"center"} fill>
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
                                                    src={`https://web3.coinmeca.net/${newChain.chainId}/logo.svg`}
                                                    alt={newChain.chainName || ""}
                                                    style={{ width: "8em", height: "8em" }}
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
                                    <Layouts.Box
                                        style={{
                                            "--white": "255,255,255",
                                            "--black": "0, 0, 0",
                                            background: "rgba(var(--white),.15)",
                                            maxHeight: "max-content",
                                            padding: "clamp(2em, 7.5%, 4em)",
                                        }}
                                        fit>
                                        <Layouts.Col gap={2} align={"left"}>
                                            <Layouts.Col gap={0.5}>
                                                <Elements.Text size={1.25} opacity={0.6}>
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
                                                <Elements.Text size={1.25} opacity={0.6}>
                                                    Native Currency Name
                                                </Elements.Text>
                                                <Elements.Text>{newChain.nativeCurrency.name}</Elements.Text>
                                            </Layouts.Col>
                                            <Layouts.Col gap={0.5}>
                                                <Elements.Text size={1.25} opacity={0.6}>
                                                    Native Currency Symbol
                                                </Elements.Text>
                                                <Elements.Text>{newChain.nativeCurrency.symbol}</Elements.Text>
                                            </Layouts.Col>
                                            <Layouts.Col gap={0.5}>
                                                <Elements.Text size={1.25} opacity={0.6}>
                                                    Native Currency Decimals
                                                </Elements.Text>
                                                <Elements.Text>{newChain.nativeCurrency.decimals}</Elements.Text>
                                            </Layouts.Col>
                                        </Layouts.Col>
                                    </Layouts.Box>
                                </Layouts.Col>
                                <Layouts.Col gap={4} align={"center"} style={{ margin: 0 }}>
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
                                            <Elements.Text type={"h2"}>Switch</Elements.Text>
                                            <Elements.Text size={1} weight={"bold"}>
                                                <Elements.Text opacity={0.6}>This is will switch the chain from </Elements.Text>{" "}
                                                <Elements.Text>{chain?.name}</Elements.Text> <Elements.Text opacity={0.6}>to</Elements.Text>{" "}
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
                    active: level === 2,
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
                                            <Elements.Text type={"h2"}>Complete</Elements.Text>
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
