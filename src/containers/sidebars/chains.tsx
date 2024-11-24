"use client";

import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { filter } from "@coinmeca/ui/lib/utils";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { Chain } from "@coinmeca/wallet-sdk/types";
import { useCallback, useState } from "react";

export default function Chains({ search, searchFilter, responsive }: { search: any; searchFilter?: string; responsive: boolean }) {
    const { provider, chain, chains } = useCoinmecaWalletProvider();

    const chainlist = useCallback(
        (chains: Chain[] = []) =>
            chains?.map((c: Chain) => ({
                style: {
                    padding: responsive ? "2.5em clamp(2em, 5%, 8em)" : "2em 3em",
                    ...(provider?.chain?.chainId === c?.chainId && { opacity: 0.3, pointerEvents: "none" }),
                },
                onClick: () => {
                    provider?.changeChain(c?.chainId);
                    // handleMobileMenu("");
                },
                children: [
                    [
                        {
                            children: (
                                <Layouts.Row gap={2}>
                                    <Layouts.Row gap={1} fit>
                                        <Elements.Avatar img={c?.logo || ""} />
                                        {/* <Avatar img={`https://web3.coinmeca.net/${c?.chainId}/logo.svg`} /> */}
                                    </Layouts.Row>
                                    <Elements.Text size={1.5}>{c?.chainName}</Elements.Text>
                                </Layouts.Row>
                            ),
                        },
                    ],
                ],
            })),
        [chain, chains],
    );

    return (
        <Layouts.Col gap={0} fill>
            {search}
            <Layouts.List list={filter(chains, searchFilter)} formatter={chainlist} />
            <Layouts.Col style={{ padding: "4em", paddingTop: "0" }} fit>
                <Controls.Button
                    type={"line"}
                    iconLeft={"plus-small-bold"}
                    onClick={() => {
                        // router.push("/create");
                    }}>
                    Add new chain
                </Controls.Button>
            </Layouts.Col>
        </Layouts.Col>
    );
}
