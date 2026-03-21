"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { Modal } from "@coinmeca/ui/containers";
import { CoinmecaWalletContextProvider, useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { dehydrate, HydrationBoundary, QueryClientProvider } from "@tanstack/react-query";
import { Chain } from "@coinmeca/wallet-sdk/types";
import { parseChainId, valid } from "@coinmeca/wallet-sdk/utils";
import { getQueryClient } from "api";
import { useTranslate } from "hooks";
import { chainLogo } from "utils";

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
    const { t } = useTranslate();
    const targetChainId = typeof props?.chain?.chainId !== "undefined" && valid.chainId(props.chain.chainId) ? parseChainId(props.chain.chainId) : undefined;
    const chain = useMemo(
        () =>
            typeof targetChainId === "number"
                ? provider?.chains?.find((item: Chain) => typeof item?.chainId !== "undefined" && parseChainId(item.chainId) === targetChainId) || props?.chain
                : props?.chain,
        [provider?.chains, props?.chain, targetChainId],
    );
    const [urls, setUrls] = useState(chain?.rpcUrls || []);
    const [selected, setSelected] = useState(chain?.rpcUrls?.[0]);

    const handleClose = (e: any) => {
        props?.onClose(e);
    };

    const handleSave = (e: any) => {
        provider?.updateChain({
            ...chain,
            rpcUrls: [selected, ...(chain?.rpcUrls?.filter((url: string) => url?.toLowerCase() !== selected?.toLowerCase()) || [])],
        });
        props?.onClose(e);
    };

    return (
        <Modal
            {...props}
            title={
                <Layouts.Row gap={1} align={"middle"} fix>
                    <Elements.Avatar size={1.5} img={chainLogo(chain?.chainId, chain?.logo)} style={{ maxWidth: "max-content" }} />
                    <Elements.Text size={1} align={"left"} fix>
                        {chain?.chainName}
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
                    <Controls.Button onClick={handleClose}>{t("app.btn.cancel")}</Controls.Button>
                    <Controls.Button onClick={handleSave}>{t("app.btn.save")}</Controls.Button>
                </Layouts.Row>
            </Layouts.Col>
        </Modal>
    );
};
