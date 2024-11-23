"use client";

import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { Modal } from "@coinmeca/ui/containers";
import { format } from "@coinmeca/ui/lib/utils";
import { CoinmecaWalletContextProvider, useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { dehydrate, HydrationBoundary, QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "api";
import { useMemo } from "react";
import { short } from "utils";

export interface Approval {
    onClose: Function;
    close?: boolean;
}

export default function Detail(props: Approval) {
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
const TxDetailModal = (props?: any) => {
    const { provider, chain } = useCoinmecaWalletProvider();
    const tx = props?.tx;
    const date = (format(tx?.time, "date") as string).split(" ");

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
            title={"Transaction Detail"}
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
                                    Block Number
                                </Elements.Text>
                                <Elements.Text
                                    align={"right"}
                                    href={chain?.blockExplorerUrls?.length ? `${chain?.blockExplorerUrls}/block/${tx?.blockNumber}` : undefined}>
                                    #{tx?.blockNumber}
                                </Elements.Text>
                            </Layouts.Row>
                            <Layouts.Row gap={1} fix>
                                <Elements.Text opacity={0.3} fit>
                                    Tx Hash
                                </Elements.Text>
                                <Elements.Text
                                    align={"right"}
                                    href={chain?.blockExplorerUrls?.length ? `${chain?.blockExplorerUrls}/tx/${tx?.hash}` : undefined}>
                                    {short(tx?.hash)}
                                </Elements.Text>
                            </Layouts.Row>
                            <Layouts.Row gap={1} fix>
                                <Elements.Text opacity={0.3} fit>
                                    To
                                </Elements.Text>
                                <Elements.Text align={"right"}>{short(tx?.to)}</Elements.Text>
                            </Layouts.Row>
                            <Layouts.Divider />
                            <Layouts.Row gap={1}>
                                <Elements.Text opacity={0.3} fit>
                                    Gas Used
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
                                    Cumulative Gas Used
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
                            <Layouts.Row gap={1}>
                                <Elements.Text opacity={0.3} fit>
                                    Effective Gas Price
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
                                    Total Cost
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
                        <Controls.Button onClick={handleClose}>Close</Controls.Button>
                    </Layouts.Row>
                </Layouts.Col>
            }
            onClose={handleClose}
            close
        />
    );
};
