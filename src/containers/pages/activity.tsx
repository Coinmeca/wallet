"use client";

import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { usePortal, useSort } from "@coinmeca/ui/hooks";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { useCallback, useEffect, useMemo } from "react";
import { filter, format } from "@coinmeca/ui/lib/utils";
import { Modals } from "containers";
import { TransactionReceipt } from "@coinmeca/wallet-sdk/types";
import { queryOptions, useQueries } from "@tanstack/react-query";
import { query } from "api/onchain/query";
import { getQueryClient } from "api";

interface Activity {
    filter?: string;
}

export default function Activity(props: Activity) {
    const client = getQueryClient();
    const { account, chain, tx, provider } = useCoinmecaWalletProvider();
    const { sorting, sortArrow, setSort } = useSort();

    const categories = useQueries({
        queries:
            tx?.map((tx) => {
                const q = query.typeOf(chain?.rpcUrls?.[0], !tx?.category ? tx?.to : undefined);
                return queryOptions({
                    ...q,
                    queryKey: [...q?.queryKey, tx?.hash],
                });
            }) || [],
    });

    const txs = useQueries({ queries: tx?.filter(({ status }) => status === "pending")?.map(({ hash }) => query.receipt(chain?.rpcUrls?.[0], hash)) || [] });
    const txlist = useMemo(
        (): TransactionReceipt[] =>
            tx
                ?.map((tx, i) => {
                    const data = txs?.find(({ data }) => data?.transactionHash?.toLowerCase() === tx?.hash?.toLowerCase())?.data;
                    if (!data) return tx;
                    const blockNumber = data?.blockNumber ? Number(data?.blockNumber) : "-";
                    const category = client?.getQueryData(["accountType", tx?.to, tx?.hash]);
                    const status = !!data?.status ? (data?.status === "0x1" ? "success" : "failure") : tx?.status;
                    const gasUsed = data?.gasUsed ? Number(data?.gasUsed) : "-";
                    const cumulativeGasUsed = data?.cumulativeGasUsed ? Number(data?.cumulativeGasUsed) : "-";
                    const effectiveGasPrice = data?.effectiveGasPrice ? Number(data?.effectiveGasPrice) : "-";

                    console.log(data);
                    return {
                        no: tx?.no,
                        hash: tx?.hash,
                        time: tx?.time,
                        to: data?.to,
                        category: data?.contractAddress ? "deploy" : tx?.category ? tx?.category : category === "ca" ? "Contract Interaction" : tx?.category,
                        contractAddress: data?.contractAddress,
                        blockNumber,
                        gasUsed,
                        status,
                        cumulativeGasUsed,
                        effectiveGasPrice,
                    };
                })
                ?.filter((tx) => tx) || [],
        [tx, txs, categories],
    );

    const sorts = {
        blockNumber: { key: "blockNumber", type: "number" },
        action: { key: "category", type: "string" },
        status: { key: "status", type: "string" },
        time: { key: "time", type: "number" },
        gas: { key: "gasUsed", type: "number" },
    };

    const color = useCallback(
        (status?: string) => {
            if (!status) return;
            switch (status) {
                case "pending":
                    return "orange";
                case "success":
                    return "green";
                case "failure":
                    return "red";
                default:
                    return;
            }
        },
        [tx],
    );

    useEffect(() => {
        return () => {
            provider?.updateReceipts(txlist, { address: account?.address, chainId: chain?.chainId });
        };
    }, []);

    const [openTxDetail, closeTxDetail] = usePortal((props: any) => <Modals.Tx.Detail {...props} onClose={closeTxDetail} />);
    const formatter = useCallback(
        (txs?: TransactionReceipt[]) =>
            txs?.map((tx) => {
                const date = (format(tx?.time, "date") as string).split(" ");
                return {
                    style: { padding: "1.5em" },
                    onClick: () => openTxDetail({ tx }),
                    children: [
                        [
                            {
                                gap: 1,
                                children: [
                                    {
                                        fit: true,
                                        children: (
                                            <>
                                                <Elements.Icon
                                                    scale={0.666}
                                                    icon={"outcome"}
                                                    style={{ padding: "0.5em", borderRadius: "100%", border: "0.1em solid rgb(var(--white))" }}
                                                />
                                            </>
                                        ),
                                    },
                                    [
                                        [
                                            [
                                                [
                                                    {
                                                        gap: 0,
                                                        children: [
                                                            <>
                                                                <Elements.Text height={0} case={"capital"}>
                                                                    {tx?.category && tx?.category !== ""
                                                                        ? tx?.category
                                                                        : `Transaction${tx?.no ? ` ${tx?.no}` : ""}`}
                                                                </Elements.Text>
                                                            </>,
                                                            <>
                                                                <Elements.Text height={0} color={color(tx?.status)} case={"capital"}>
                                                                    {tx?.status}
                                                                </Elements.Text>
                                                            </>,
                                                        ],
                                                    },
                                                ],
                                            ],
                                            {
                                                fit: true,
                                                children: [
                                                    [
                                                        {
                                                            gap: 0,
                                                            children: [
                                                                {
                                                                    align: "right",
                                                                    children: (
                                                                        <>
                                                                            <Elements.Text type={"desc"} opacity={0.6}>
                                                                                {date[0]}
                                                                            </Elements.Text>
                                                                        </>
                                                                    ),
                                                                },
                                                                {
                                                                    align: "right",
                                                                    children: (
                                                                        <>
                                                                            <Elements.Text type={"desc"} opacity={0.6}>
                                                                                {date[1]}
                                                                            </Elements.Text>
                                                                        </>
                                                                    ),
                                                                },
                                                            ],
                                                        },
                                                    ],
                                                ],
                                            },
                                        ],
                                    ],
                                ],
                            },
                        ],
                    ],
                };
            }),
        [tx],
    );

    return (
        <Layouts.Contents.InnerContent>
            <Layouts.Row gap={1} fix style={{ overflow: "auto hidden" }}>
                <Layouts.Row gap={0} fix>
                    <Controls.Tab iconLeft={sortArrow(sorts.blockNumber)} onClick={() => setSort(sorts.blockNumber)}>
                        Block Number
                    </Controls.Tab>
                    <Controls.Tab iconLeft={sortArrow(sorts.action)} onClick={() => setSort(sorts.action)}>
                        Action
                    </Controls.Tab>
                    <Controls.Tab iconLeft={sortArrow(sorts.status)} onClick={() => setSort(sorts.status)}>
                        Status
                    </Controls.Tab>
                    <Controls.Tab iconLeft={sortArrow(sorts.time)} onClick={() => setSort(sorts.time)}>
                        Time
                    </Controls.Tab>
                    <Controls.Tab iconLeft={sortArrow(sorts.gas)} onClick={() => setSort(sorts.gas)}>
                        Gas Used
                    </Controls.Tab>
                </Layouts.Row>
            </Layouts.Row>
            <Layouts.Divider />
            <Layouts.List list={filter(sorting(txlist), props?.filter)} formatter={formatter} fill />
        </Layouts.Contents.InnerContent>
    );
}
