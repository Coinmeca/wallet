'use client';

import { Elements, Layouts } from "@coinmeca/ui/components";
import { usePortal } from "@coinmeca/ui/hooks";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { useCallback, useEffect, useMemo } from "react";
import { capitalize, format } from "@coinmeca/ui/lib/utils";
import { Modals } from "containers";
import { TransactionReceipt } from "@coinmeca/wallet-sdk/types";
import { useQueries } from "@tanstack/react-query";
import { query } from "api/onchain/query";
import { short } from "utils";

export default function Activity() {
    const { account, chain, tx, provider } = useCoinmecaWalletProvider();
    const txs = useQueries({queries: tx?.filter(({status}) => status === "pending")?.map(({ hash }) => query.receipt(chain?.rpcUrls?.[0], hash)) || []});
    const txlist = useMemo(() => tx?.map((tx) => {
        const data = txs?.find(({ data }) => data?.transactionHash?.toLowerCase() === tx?.hash?.toLowerCase())?.data;
        if (!data) return tx;
        const blockNumber = data?.blockNumber ? Number(data?.blockNumber) : '-';
        const status = !!data?.status ? data?.status === "0x1" ? "success" : "failure" : tx?.status;
        const gasUsed = data?.gasUsed ? Number(data?.gasUsed) : '-';
        const cumulativeGasUsed = data?.cumulativeGasUsed ? Number(data?.cumulativeGasUsed) : '-';
        const effectiveGasPrice = data?.effectiveGasPrice ? Number(data?.effectiveGasPrice) : '-';
        console.log({ data });
        return { hash:tx?.hash, to: data?.to, blockNumber, gasUsed, status, cumulativeGasUsed, effectiveGasPrice }
    }), [tx, txs]);

    useEffect(() => {
        return () => {
            provider?.updateReceipts(txlist, {address:account?.address, chainId: chain?.chainId})
        }
    }, [])
    
    console.log({ tx });
    
    const color = useCallback((status?:string) => {
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
    }, [tx])

    const [openTxDetail, closeTxDetail] = usePortal((props:any) => <Modals.Tx.Detail {...props} onClose={closeTxDetail} />);
    const formatter = useCallback(
        (txs?: TransactionReceipt[]) => txs?.map(
            (tx?: TransactionReceipt) => {
                const date = (format(tx?.time, "date") as string).split(" ");    
                return {
                    style: { padding: "1.5em" },
                    onClick: () => openTxDetail({tx}),
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
                                                                    <Elements.Text height={0}>
                                                                        Contract Interaction
                                                                        {/* {short(tx?.hash)} */}
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
                                                    fit:true,
                                                    children:[
                                                        [
                                                            {
                                                                align: "right",
                                                                children: [
                                                                    <>
                                                                        <Elements.Text>
                                                                            {date[0]}
                                                                        </Elements.Text>
                                                                    </>,
                                                                    <>
                                                                        <Elements.Text>
                                                                            {date[1]}
                                                                        </Elements.Text>
                                                                    </>]
                                                                ,
                                                            },
                                                        ]
                                                    ]
                                                },
                                            ],
                                        ],
                                    ],
                                },
                            ],
                        ],
                    }},
            ),
        [tx],
    );
    return  <Layouts.List
        list={txlist}
        formatter={formatter}
        fill
    />
}
