"use client";

import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { useStorage, useWallet } from "hooks";
import { usePathname, useSearchParams } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { Chain } from "wallet/provider";
/*
http://localhost:3000/wallet_addEthereumChain?id=421614&base=evm&name=Arbitrum+Sepolia&logo=https%3A%2F%2Fcoinmeca-web3.vercel.app%2F42161%2Flogo.svg&rpc%5B%5D=https%3A%2F%2Fsepolia-rollup.arbitrum.io%2Frpc&rpc%5B%5D=https%3A%2F%2Farbitrum-sepolia.blockpi.network%2Fv1%2Frpc%2Fpublic&rpc%5B%5D=https%3A%2F%2Fendpoints.omniatech.io%2Fv1%2Farbitrum%2Fsepolia%2Fpublic&explorer%5B%5D=https%3A%2F%2Fsepolia.arbiscan.io%2F&nativeCurrency%5Bname%5D=Ethereum&nativeCurrency%5Bsymbol%5D=ETH&nativeCurrency%5Bdecimals%5D=18
*/
export default function wallet_addEthereumChain({ params }: { params: any }) {
    const { chain } = params;

    const { storage, session } = useStorage();
    const { provider } = useWallet();
    const [level, setLevel] = useState(0);

    console.log({ chain });

    const handleCancel = () => {};

    const handleClose = () => {};

    const handleAddChain = () => {
        const key = session?.get("key");
        const chains = storage?.get(`${key}:chains`);

        const { chainId, rpcUrls, nativeCurrency } = chain;
        if (!chainId || !rpcUrls || rpcUrls.length === 0 || !nativeCurrency.decimals) {
            // error
        }

        const exist = chains.find((c: Chain) => c?.chainId === chainId);
        if (exist) chains.map((c: Chain) => (c?.chainId === chainId ? chain : c));
        else chain.push(chain);

        setLevel(1);
    };

    const handleSwitchChain = () => {
        provider?.changeChain(chain);
    };

    useLayoutEffect(() => {}, []);

    return (
        <Layouts.Contents.SlideContainer
            contents={[
                {
                    active: level === 0,
                    children: (
                        <Layouts.Contents.InnerContent scroll={false}>
                            <Layouts.Col align={"center"} style={{ padding: "4em" }} fill>
                                <Layouts.Col gap={4} align={"center"} fit>
                                    <Elements.Text type={"h6"} opacity={0.6}>
                                        {chain?.name}
                                    </Elements.Text>
                                    <Elements.Icon
                                        icon={"wallet"}
                                        scale={3}
                                        style={{ padding: "0.5em", borderRadius: "4em", background: "rgba(var(--white),.15)" }}
                                    />
                                    <Elements.Text type={"h6"}>{chain && chain?.chainName}</Elements.Text>
                                </Layouts.Col>
                                <Layouts.Col align={"center"} style={{ padding: "4em" }} fill>
                                    <Layouts.Col gap={4} align={"center"} fit>
                                        <Elements.Text type={"h2"}> Import </Elements.Text>
                                        <Elements.Text weight={"bold"} opacity={0.6}>
                                            Please enter a private key of the wallet that be imported.
                                        </Elements.Text>
                                    </Layouts.Col>
                                </Layouts.Col>
                                <Layouts.Col gap={4} align={"center"} style={{ margin: 0 }}>
                                    <Layouts.Row gap={2}>
                                        <Controls.Button type={"glass"} onClick={handleCancel}>
                                            Cancel
                                        </Controls.Button>
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
                                <Layouts.Col gap={4} align={"center"} fit>
                                    {" "}
                                </Layouts.Col>
                            </Layouts.Col>
                            <Layouts.Col gap={0} align={"center"} fill>
                                <Layouts.Col align={"center"} style={{ padding: "4em" }} fill>
                                    <Layouts.Col gap={4} align={"center"} fit>
                                        <Elements.Text type={"h2"}> Import </Elements.Text>
                                        <Elements.Text weight={"bold"} opacity={0.6}>
                                            Please enter a private key of the wallet that be imported.
                                        </Elements.Text>
                                    </Layouts.Col>
                                </Layouts.Col>
                                <Layouts.Col gap={4} align={"center"} style={{ margin: 0 }}>
                                    <Layouts.Row gap={2}>
                                        <Controls.Button type={"glass"} onClick={handleClose}>
                                            OK
                                        </Controls.Button>
                                        <Controls.Button type={"line"} onClick={handleSwitchChain}>
                                            Switch Chain
                                        </Controls.Button>
                                    </Layouts.Row>
                                </Layouts.Col>
                            </Layouts.Col>
                        </Layouts.Contents.InnerContent>
                    ),
                },
            ]}
        />
    );
}
