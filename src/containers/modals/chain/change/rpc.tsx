"use client";

import Image from "next/image";
import { useState } from "react";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { Modal } from "@coinmeca/ui/containers";
import { CoinmecaWalletContextProvider, useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { dehydrate, HydrationBoundary, QueryClientProvider } from "@tanstack/react-query";
import { Chain } from "@coinmeca/wallet-sdk/types";
import { getQueryClient } from "api";

export interface Rpc {
    chain?: Chain;
    onClose: Function;
    close?: boolean;
}

export default function Rpc(props: Rpc) {
    const client = getQueryClient();

    return (
        <CoinmecaWalletContextProvider>
            <QueryClientProvider {...{ client }}>
                <HydrationBoundary state={dehydrate(client)}>
                    <RpcChangeModal {...props} />
                </HydrationBoundary>
            </QueryClientProvider>
        </CoinmecaWalletContextProvider>
    );
}

const RpcChangeModal = (props: any) => {
    const { provider } = useCoinmecaWalletProvider();
    const [urls, setUrls] = useState(props?.chain?.rpcUrls || []);
    const [selected, setSelected] = useState(props?.chain?.rpcUrls?.[0]);

    const handleClose = (e: any) => {
        props?.onClose(e);
    };

    const handleSave = (e: any) => {
        provider?.updateChain({
            ...props?.chain,
            rpcUrls: [selected, ...props?.chain?.rpcUrls?.filter((url: string) => url?.toLowerCase() !== selected?.toLowerCase())],
        });
        props?.onClose(e);
    };

    return (
        <Modal
            {...props}
            title={
                <Layouts.Row gap={1} align={"middle"} fix>
                    <Elements.Avatar size={1.5} img={`https://web3.coinmeca.net/${props?.chain?.chainId}/logo.svg`} style={{ maxWidth: "max-content" }} />
                    <Elements.Text size={1} align={"left"} fix>
                        {props?.chain?.chainName}
                    </Elements.Text>
                </Layouts.Row>
            }
            onClose={handleClose}
            close>
            <Layouts.Col gap={2} style={{ minHeight: "2em" }}>
                <Layouts.List
                    list={urls}
                    formatter={(urls: string[]) =>
                        urls &&
                        urls?.length &&
                        urls?.map((url: string) => ({
                            onClick: selected !== url && (() => setSelected(url)),
                            children: [
                                [
                                    {
                                        gap: 0.5,
                                        children: [
                                            {
                                                fit: true,
                                                children: (
                                                    <>
                                                        <div
                                                            style={{
                                                                width: "4em",
                                                                height: "4em",
                                                            }}>
                                                            {selected === url && (
                                                                <Image
                                                                    src={require("../../../../assets/animation/success.gif")}
                                                                    width={0}
                                                                    height={0}
                                                                    alt={"check"}
                                                                    style={{ width: "100%", height: "100%" }}
                                                                />
                                                            )}
                                                        </div>
                                                    </>
                                                ),
                                            },
                                            <>
                                                <Elements.Text align={"left"} opacity={selected === url ? 1 : 0.45}>
                                                    {url}
                                                </Elements.Text>
                                            </>,
                                        ],
                                    },
                                ],
                            ],
                        }))
                    }
                />
                <Layouts.Row>
                    <Controls.Button onClick={handleClose}>Cancel</Controls.Button>
                    <Controls.Button onClick={handleSave}>Save</Controls.Button>
                </Layouts.Row>
            </Layouts.Col>
        </Modal>
    );
};
