"use client";

import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { parseChainId } from "@coinmeca/wallet-provider/chains";
import { CoinmecaWalletContextProvider, useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { dehydrate, HydrationBoundary, QueryClientProvider } from "@tanstack/react-query";

import { getQueryClient } from "api";
import { Modal } from "@coinmeca/ui/containers";
import { Attribute } from "types";
import { short } from "utils";
import Image from "next/image";
import { useWindowSize } from "@coinmeca/ui/hooks";
import { useTranslate } from "hooks";
import { useMemo } from "react";
import { valid } from "utils";

export interface Info {
    [x: string | number | symbol]: any;
    onTransfer?: Function;
    onClose: Function;
    close?: boolean;
}

export default function Info(props: Info) {
    const client = getQueryClient();

    return (
        <CoinmecaWalletContextProvider>
            <QueryClientProvider {...{ client }}>
                <HydrationBoundary state={dehydrate(client)}>
                    <NonFungibleInfoModal {...props} />
                </HydrationBoundary>
            </QueryClientProvider>
        </CoinmecaWalletContextProvider>
    );
}

function NonFungibleInfoModal(props: Info) {
    const { windowSize } = useWindowSize();
    const { provider } = useCoinmecaWalletProvider();
    const { t } = useTranslate();
    const activeChainId = useMemo(() => {
        const providerChainId = provider?.chainId;
        return typeof providerChainId !== "undefined" && valid.chainId(providerChainId) ? parseChainId(providerChainId) : undefined;
    }, [provider?.chainId]);
    const activeChain = useMemo(
        () =>
            typeof activeChainId === "number"
                ? provider?.chains?.find((item: any) => typeof item?.chainId !== "undefined" && parseChainId(item.chainId) === activeChainId)
                : undefined,
        [activeChainId, provider?.chains],
    );

    const handleClose = (e?: any) => {
        props?.onClose(e);
    };

    const desktop = windowSize?.width > 840;

    const data = props?.data;
    const uri = data?.uri;
    const attributes = uri?.attributes;

    const content = (
        <Layouts.Contents.InnerContent
            style={{
                fontFeatureSettings: `'tnum' on, 'lnum' on`,
            }}
            scroll={attributes && attributes?.length}>
            <Layouts.Col gap={1}>
                <Layouts.Col gap={2}>
                    <Layouts.Row gap={1} fix>
                        <Elements.Text opacity={0.3} fit>
                            {t("modal.nft.detail.address")}
                        </Elements.Text>
                        <Elements.Text
                            align={"right"}
                            title={data?.address}
                            href={activeChain?.blockExplorerUrls?.length ? `${activeChain?.blockExplorerUrls}/address/${data?.address}` : undefined}>
                            {short(data?.address)}
                        </Elements.Text>
                    </Layouts.Row>
                    <Layouts.Divider />
                    <Layouts.Row gap={1} fix>
                        <Elements.Text opacity={0.3} fit>
                            {t("modal.nft.detail.id")}
                        </Elements.Text>
                        <Elements.Text
                            align={"right"}
                            href={activeChain?.blockExplorerUrls?.length ? `${activeChain?.blockExplorerUrls}/nft/${data?.address}/${data?.tokenId}` : undefined}>
                            {data?.tokenId}
                        </Elements.Text>
                    </Layouts.Row>
                    <Layouts.Row gap={1}>
                        <Elements.Text opacity={0.3} fit>
                            {t("modal.nft.detail.name")}
                        </Elements.Text>
                        <Layouts.Row gap={1} align={"right"} style={{ minWidth: "max-content" }} fix>
                            <Elements.Text align={"right"}>{uri?.name}</Elements.Text>
                        </Layouts.Row>
                    </Layouts.Row>
                </Layouts.Col>
                {attributes && attributes?.length && (
                    <>
                        <Layouts.Divider />
                        <Layouts.Contents.GridContainer gap={1} direction={"row"} width={{ min: "clamp(16em, 25%, 32em)" }}>
                            {attributes?.map((trait: Attribute, i: number) => (
                                <Layouts.Col
                                    key={i}
                                    gap={0}
                                    align={"center"}
                                    style={{
                                        background: "rgba(var(--white),0.15)",
                                        width: "auto",
                                        height: "auto",
                                        padding: "2em 1em",
                                    }}>
                                    <Elements.Text opacity={0.3} fit>
                                        {trait?.trait_type}
                                    </Elements.Text>
                                    <Elements.Text
                                        href={
                                            activeChain?.blockExplorerUrls?.length &&
                                            trait?.value &&
                                            trait?.value?.toString().startsWith("0x") &&
                                            trait?.value?.toString().length === 42
                                                ? `${activeChain?.blockExplorerUrls}/address/${trait?.value}`
                                                : undefined
                                        }>
                                        {trait?.value && trait?.value?.toString().startsWith("0x") && trait?.value?.toString().length === 42
                                            ? short(trait?.value?.toString())
                                            : trait?.value}
                                    </Elements.Text>
                                </Layouts.Col>
                            ))}
                        </Layouts.Contents.GridContainer>
                    </>
                )}
            </Layouts.Col>
        </Layouts.Contents.InnerContent>
    );

    return (
        <Modal {...props} title={uri?.name || t("modal.nft.detail.title")} width={desktop ? 96 : undefined} onClose={handleClose} close>
            <Layouts.Col gap={2} style={{ height: "100%" }}>
                {desktop ? (
                    attributes && attributes?.length ? (
                        <Layouts.Row style={{ overflow: "hidden" }} fix>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    position: "relative",
                                    width: "100%",
                                }}>
                                <Image
                                    width={0}
                                    height={0}
                                    src={data?.isLoading ? require("../../../assets/animation/loading.gif") : data?.image}
                                    alt={data?.tokenId || ""}
                                    style={{ position: "absolute", width: "100%", height: "100%" }}
                                />
                            </div>
                            <Layouts.Divider vertical />
                            {content}
                        </Layouts.Row>
                    ) : (
                        <Layouts.Contents.InnerContent>
                            <Layouts.Col style={{ overflow: "hidden" }}>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        position: "relative",
                                        width: "100%",
                                    }}>
                                    <Image
                                        width={0}
                                        height={0}
                                        src={data?.isLoading ? require("../../../assets/animation/loading.gif") : data?.image}
                                        alt={data?.tokenId || ""}
                                        style={{ position: "absolute", width: "100%", height: "100%" }}
                                    />
                                </div>
                                <Layouts.Divider />
                                {content}
                            </Layouts.Col>
                        </Layouts.Contents.InnerContent>
                    )
                ) : (
                    content
                )}
                <Layouts.Row gap={2} style={{ marginTop: "2em" }} fix>
                    <Controls.Button onClick={handleClose}>{t("app.btn.close")}</Controls.Button>
                    {props?.onTransfer && (
                        <Controls.Button
                            onClick={(e: any) => {
                                props?.onTransfer?.(data);
                                handleClose(e);
                            }}>
                            {t("tx.detail.send")}
                        </Controls.Button>
                    )}
                </Layouts.Row>
            </Layouts.Col>
        </Modal>
    );
}
