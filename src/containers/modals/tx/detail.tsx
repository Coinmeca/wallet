"use client";

import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { Modal } from "@coinmeca/ui/containers";
import { format } from "@coinmeca/ui/lib/utils";
import { parseChainId } from "@coinmeca/wallet-provider/chains";
import { CoinmecaWalletContextProvider, useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { dehydrate, HydrationBoundary, QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "api";
import { useMemo } from "react";
import { short, valid } from "utils";
import { useTranslate } from "hooks";

export interface Detail {
    [x: string | number | symbol]: any;
    onClose: Function;
    close?: boolean;
}

export default function Detail(props: Detail) {
    const client = getQueryClient();

    return (
        <CoinmecaWalletContextProvider>
            <QueryClientProvider {...{ client }}>
                <HydrationBoundary state={dehydrate(client)}>
                    <TxDetailModal {...props} />
                </HydrationBoundary>
            </QueryClientProvider>
        </CoinmecaWalletContextProvider>
    );
}
const TxDetailModal = (props?: Detail) => {
    const { provider } = useCoinmecaWalletProvider();
    const { t } = useTranslate();
    const tx = props?.tx;
    const date = (format(tx?.time, "date") as string).split(" ");
    const txChainId = useMemo(() => {
        if (typeof tx?.chainId !== "undefined" && valid.chainId(tx.chainId)) return parseChainId(tx.chainId);
        const providerChainId = provider?.chainId;
        return typeof providerChainId !== "undefined" && valid.chainId(providerChainId) ? parseChainId(providerChainId) : undefined;
    }, [provider?.chainId, tx?.chainId]);
    const chain = useMemo(
        () =>
            typeof txChainId === "number"
                ? provider?.chains?.find((item: any) => typeof item?.chainId !== "undefined" && parseChainId(item.chainId) === txChainId)
                : undefined,
        [provider?.chains, txChainId],
    );
    const blockExplorerUrl = chain?.blockExplorerUrls?.[0];

    const handleClose = () => {
        props?.onClose();
    };

    const color = useMemo(() => {
        switch (tx?.status) {
            case "pending":
                return "orange";
            case "success":
                return "green";
            case "failure":
                return "red";
            default:
                return;
        }
    }, [tx]);

    const decimals = 10 ** (chain?.nativeCurrency?.decimals || 18);

    return (
        <Modal
            title={t("tx.detail")}
            content={
                <Layouts.Col gap={2} style={{ height: "100%" }}>
                    <Layouts.Contents.InnerContent
                        style={{
                            fontFeatureSettings: `'tnum' on, 'lnum' on`,
                        }}>
                        <Layouts.Col gap={1}>
                            <Layouts.Row gap={1} fix>
                                <Layouts.Col align={"left"} gap={0}>
                                    <Elements.Text height={1.5} case={"capital"}>
                                        {tx?.category && tx?.category !== "" ? tx?.category : `Transaction${tx?.no ? ` ${tx?.no}` : ""}`}
                                    </Elements.Text>
                                    <Elements.Text height={1.5} color={color} case={"capital"}>
                                        {tx?.status}
                                    </Elements.Text>
                                </Layouts.Col>
                                <Layouts.Col gap={0} style={{ maxWidth: "max-content" }}>
                                    <Elements.Text type={"desc"} height={1.5} opacity={0.6} align={"right"}>
                                        {date[0]}
                                    </Elements.Text>
                                    <Elements.Text type={"desc"} height={1.5} opacity={0.6} align={"right"}>
                                        {date[1]}
                                    </Elements.Text>
                                </Layouts.Col>
                            </Layouts.Row>
                            <Layouts.Divider />
                            <Layouts.Row gap={1} fix>
                                <Elements.Text opacity={0.3} fit>
                                    {t("activity.block.number")}
                                </Elements.Text>
                                <Layouts.Row align={"right"} fix>
                                    <Elements.Text
                                        align={"right"}
                                        href={blockExplorerUrl ? `${blockExplorerUrl}/block/${tx?.blockNumber}` : undefined}
                                        fit
                                        fix>
                                        #{tx?.blockNumber}
                                    </Elements.Text>
                                </Layouts.Row>
                            </Layouts.Row>
                            <Layouts.Row gap={1} fix>
                                <Elements.Text opacity={0.3} fit>
                                    {t("modal.tx.detail.hash")}
                                </Elements.Text>
                                <Layouts.Row align={"right"} fix>
                                    <Elements.Text
                                        align={"right"}
                                        title={tx?.hash}
                                        href={blockExplorerUrl ? `${blockExplorerUrl}/tx/${tx?.hash}` : undefined}
                                        fit
                                        fix>
                                        {short(tx?.hash)}
                                    </Elements.Text>
                                </Layouts.Row>
                            </Layouts.Row>
                            <Layouts.Row gap={1} fix>
                                <Elements.Text opacity={0.3} fit>
                                    {t("modal.tx.detail.to")}
                                </Elements.Text>
                                <Elements.Text align={"right"}>{short(tx?.to)}</Elements.Text>
                            </Layouts.Row>
                            <Layouts.Divider />
                            <Layouts.Row gap={1}>
                                <Elements.Text opacity={0.3} fit>
                                    {t("activity.gas.used")}
                                </Elements.Text>
                                <Layouts.Row gap={1} align={"right"} style={{ minWidth: "max-content" }} fix>
                                    <Elements.Text align={"right"} fix>
                                        {format(tx?.gasUsed, "currency", { unit: 9, limit: 12, fix: 3 })}
                                    </Elements.Text>
                                    {/* <Elements.Text opacity={0.3} align={"left"} style={{ maxWidth: "6em" }}>
                                        {chain?.nativeCurrency?.symbol}
                                    </Elements.Text> */}
                                </Layouts.Row>
                            </Layouts.Row>
                            <Layouts.Row gap={1}>
                                <Elements.Text opacity={0.3} fit>
                                    {t("modal.tx.detail.cumulative.gas.used")}
                                </Elements.Text>
                                <Layouts.Row gap={1} align={"right"} style={{ minWidth: "max-content" }} fix>
                                    <Elements.Text align={"right"} fix>
                                        {format(tx?.cumulativeGasUsed, "currency", { unit: 9, limit: 12, fix: 3 })}
                                    </Elements.Text>
                                    {/* <Elements.Text opacity={0.3} align={"left"} style={{ maxWidth: "6em" }}>
                                        {chain?.nativeCurrency?.symbol}
                                    </Elements.Text> */}
                                </Layouts.Row>
                            </Layouts.Row>
                            <Layouts.Row gap={1}>
                                <Elements.Text opacity={0.3} fit>
                                    {t("modal.tx.detail.effective.gas.price")}
                                </Elements.Text>
                                <Layouts.Row gap={1} align={"right"} style={{ minWidth: "max-content" }} fix>
                                    <Elements.Text align={"right"} fix>
                                        {format(tx?.effectiveGasPrice, "currency", { unit: 9, limit: 12, fix: 3 })}
                                    </Elements.Text>
                                    {/* <Elements.Text opacity={0.3} align={"left"} style={{ maxWidth: "6em" }}>
                                        {chain?.nativeCurrency?.symbol}
                                    </Elements.Text> */}
                                </Layouts.Row>
                            </Layouts.Row>
                            <Layouts.Divider />
                            <Layouts.Row gap={1}>
                                <Elements.Text opacity={0.3} fit>
                                    {t("modal.tx.detail.total.cost")}
                                </Elements.Text>
                                <Layouts.Row gap={1} align={"right"} style={{ minWidth: "max-content" }} fix>
                                    <Elements.Text align={"right"} fix>
                                        {format((tx?.gasUsed * tx?.effectiveGasPrice) / decimals, "currency", {
                                            limit: 12,
                                            fix: 3,
                                        })}
                                    </Elements.Text>
                                    <Elements.Text opacity={0.3} align={"left"} style={{ maxWidth: "6em" }}>
                                        {chain?.nativeCurrency?.symbol}
                                    </Elements.Text>
                                </Layouts.Row>
                            </Layouts.Row>
                        </Layouts.Col>
                    </Layouts.Contents.InnerContent>
                    <Layouts.Row gap={2} style={{ marginTop: "2em" }} fix>
                        <Controls.Button onClick={handleClose}>{t("app.btn.close")}</Controls.Button>
                    </Layouts.Row>
                </Layouts.Col>
            }
            onClose={handleClose}
            close
        />
    );
};
