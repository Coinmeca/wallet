"use client";

import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { usePortal, useSort } from "@coinmeca/ui/hooks";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { parseChainId } from "@coinmeca/wallet-provider/chains";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { chainUrl } from "@coinmeca/wallet-sdk/utils";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { filter, format } from "@coinmeca/ui/lib/utils";
import { TransactionReceipt } from "@coinmeca/wallet-sdk/types";
import { queryOptions, useQueries, useQuery } from "@tanstack/react-query";
import { Tx as Modals } from "containers/modals";
import { query } from "api/onchain/query";
import { useTranslate } from "hooks";
import { valid } from "utils";

interface Activity {
    filter?: string;
}

export default function Activity(props: Activity) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { tx, provider } = useCoinmecaWalletProvider();
    const { sorting, sortArrow, setSort } = useSort();
    const { t } = useTranslate();
    const latest = useRef<{
        provider: typeof provider;
        txlist: TransactionReceipt[];
        address?: string;
        chainId?: number;
    }>({ provider, txlist: [] });
    const openedDetail = useRef("");
    const rawQueryHash = searchParams?.get("tx")?.trim().toLowerCase() || "";
    const queryHash = useMemo(() => {
        return valid.hash(rawQueryHash) ? rawQueryHash : "";
    }, [rawQueryHash]);
    const queryAddress = searchParams?.get("address")?.trim() || "";
    const queryRpcUrl = useMemo(() => {
        const value = chainUrl(searchParams?.get("rpcUrl"), "rpc");
        if (!value) return;
        try {
            const protocol = new URL(value).protocol.toLowerCase();
            return ["http:", "https:"].includes(protocol) ? value : undefined;
        } catch {
            return;
        }
    }, [searchParams]);
    const queryChainId = useMemo(() => {
        const value = searchParams?.get("chainId");
        return value && valid.chainId(value) ? parseChainId(value) : undefined;
    }, [searchParams]);
    const activeAddress = provider?.address;
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

    const categories = useQueries({
        queries:
            tx?.map((tx) => {
                const q = query.typeOf(activeChain?.rpcUrls?.[0], !tx?.category ? tx?.to : undefined);
                return queryOptions({
                    ...q,
                    queryKey: [...q?.queryKey, tx?.hash],
                });
            }) || [],
    });

    const txs = useQueries({
        queries: tx?.filter(({ status }) => status === "pending")?.map(({ hash }) => query.receipt(activeChain?.rpcUrls?.[0], hash)) || [],
    });
    const txlist = useMemo(
        (): TransactionReceipt[] =>
            tx
                ?.map((tx, i) => {
                    const txChainId =
                        typeof tx?.chainId !== "undefined" && valid.chainId(tx.chainId)
                            ? parseChainId(tx.chainId)
                            : activeChainId;
                    const data = txs?.find(({ data }) => data?.transactionHash?.toLowerCase() === tx?.hash?.toLowerCase())?.data;
                    if (!data) return typeof txChainId === "number" && typeof tx?.chainId === "undefined" ? { ...tx, chainId: txChainId } : tx;
                    const blockNumber = data?.blockNumber ? Number(data?.blockNumber) : "-";
                    const category = categories?.[i]?.data;
                    const status = !!data?.status ? (data?.status === "0x1" ? "success" : "failure") : tx?.status;
                    const gasUsed = data?.gasUsed ? Number(data?.gasUsed) : "-";
                    const cumulativeGasUsed = data?.cumulativeGasUsed ? Number(data?.cumulativeGasUsed) : "-";
                    const effectiveGasPrice = data?.effectiveGasPrice ? Number(data?.effectiveGasPrice) : "-";

                    return {
                        no: tx?.no,
                        hash: tx?.hash,
                        chainId: txChainId,
                        time: tx?.time,
                        to: data?.to,
                        category:
                            data?.contractAddress
                                ? "deploy"
                                : tx?.category
                                  ? tx?.category
                                  : category === "ca"
                                    ? t("activity.category.contract.interaction")
                                    : tx?.category,
                        contractAddress: data?.contractAddress,
                        blockNumber,
                        gasUsed,
                        status,
                        cumulativeGasUsed,
                        effectiveGasPrice,
                    };
                })
                ?.filter((tx) => tx) || [],
        [activeChainId, categories, tx, txs, t],
    );
    const queryReceipt = useMemo(() => {
        if (!queryHash) return;
        const receipt = provider?.getReceipt(queryHash, {
            address: queryAddress && valid.address(queryAddress) ? queryAddress : undefined,
            chainId: queryChainId,
        });
        if (!receipt) return;
        if (typeof receipt.chainId !== "undefined") return receipt;
        const fallbackChainId = queryChainId || activeChainId;
        return typeof fallbackChainId === "number" ? { ...receipt, chainId: fallbackChainId } : receipt;
    }, [activeChainId, provider, queryAddress, queryChainId, queryHash]);
    const queryReceiptChainId = useMemo(() => {
        const value = queryReceipt?.chainId;
        return typeof value !== "undefined" && valid.chainId(value) ? parseChainId(value) : queryChainId;
    }, [queryChainId, queryReceipt?.chainId]);
    const queryChain = useMemo(
        () =>
            typeof queryReceiptChainId === "number"
                ? provider?.chains?.find((item: any) => typeof item?.chainId !== "undefined" && parseChainId(item.chainId) === queryReceiptChainId)
                : undefined,
        [provider?.chains, queryReceiptChainId],
    );
    const queryReceiptRemote = useQuery({
        ...query.receipt(queryChain?.rpcUrls?.[0] || queryRpcUrl, queryHash),
        enabled: !!queryHash && !!(queryChain?.rpcUrls?.[0] || queryRpcUrl),
    });
    const resolvedQueryReceipt = useMemo(() => {
        if (!queryHash) return;
        if (!queryReceipt && !queryReceiptRemote.data) return;
        if (!queryReceiptRemote.data) return queryReceipt;

        const remote = queryReceiptRemote.data;
        const chainId = queryReceiptChainId;
        const status = typeof remote?.status !== "undefined" ? (remote.status === "0x1" ? "success" : "failure") : queryReceipt?.status || "pending";

        return {
            ...queryReceipt,
            hash: queryReceipt?.hash || queryHash,
            chainId,
            status,
            time: queryReceipt?.time,
            to: remote?.to || queryReceipt?.to,
            from: remote?.from || queryReceipt?.from,
            category: remote?.contractAddress ? "deploy" : queryReceipt?.category,
            contractAddress: remote?.contractAddress || queryReceipt?.contractAddress,
            blockNumber: remote?.blockNumber ? Number(remote.blockNumber) : queryReceipt?.blockNumber,
            gasUsed: remote?.gasUsed ? Number(remote.gasUsed) : queryReceipt?.gasUsed,
            cumulativeGasUsed: remote?.cumulativeGasUsed ? Number(remote.cumulativeGasUsed) : queryReceipt?.cumulativeGasUsed,
            effectiveGasPrice: remote?.effectiveGasPrice ? Number(remote.effectiveGasPrice) : queryReceipt?.effectiveGasPrice,
            no: queryReceipt?.no,
        } as TransactionReceipt;
    }, [queryHash, queryReceipt, queryReceiptChainId, queryReceiptRemote.data]);

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
        latest.current = {
            provider,
            txlist,
            address: activeAddress,
            chainId: activeChainId,
        };
    }, [provider, txlist, activeAddress, activeChainId]);

    useEffect(() => {
        return () => {
            const current = latest.current;
            current.provider?.updateReceipts(current.txlist, { address: current.address, chainId: current.chainId });
        };
    }, []);

    useEffect(() => {
        if (!rawQueryHash || queryHash) return;
        router.replace(pathname || "/activity");
    }, [pathname, queryHash, rawQueryHash, router]);

    useEffect(() => {
        if (!provider || !queryReceiptRemote.data) return;
        if (!queryAddress || !valid.address(queryAddress)) return;
        if (typeof queryReceiptChainId !== "number") return;

        provider.updateReceipt(
            {
                ...resolvedQueryReceipt,
                hash: resolvedQueryReceipt?.hash || queryHash,
                chainId: queryReceiptChainId,
            } as TransactionReceipt,
            { address: queryAddress, chainId: queryReceiptChainId },
        );
    }, [provider, queryAddress, queryHash, queryReceiptChainId, queryReceiptRemote.data, resolvedQueryReceipt]);

    const [openTxDetail, closeTxDetail] = usePortal((props: any) => <Modals.Detail {...props} onClose={props?.onClose || closeTxDetail} />);
    const openDetail = useCallback(
        (tx?: TransactionReceipt, preserveQuery = false) => {
            if (!tx?.hash) return;
            openedDetail.current = `${tx.hash.toLowerCase()}:${tx.status || ""}:${tx.blockNumber || ""}`;
            if (!preserveQuery) router.replace(`${pathname || "/activity"}?tx=${encodeURIComponent(tx.hash)}`);
            openTxDetail({
                tx,
                onClose: () => {
                    closeTxDetail();
                    router.replace(pathname || "/activity");
                },
            });
        },
        [closeTxDetail, openTxDetail, pathname, router],
    );

    useEffect(() => {
        if (!queryHash) {
            openedDetail.current = "";
            return;
        }

        const target = txlist.find((item) => item?.hash?.toLowerCase() === queryHash) || resolvedQueryReceipt;
        const nextKey = target?.hash ? `${target.hash.toLowerCase()}:${target.status || ""}:${target.blockNumber || ""}` : "";
        if (!target || openedDetail.current === nextKey) return;
        openedDetail.current = nextKey;
        openDetail(target, true);
    }, [openDetail, queryHash, resolvedQueryReceipt, txlist]);

    useEffect(() => {
        if (!queryHash) return;
        if (txlist.some((item) => item?.hash?.toLowerCase() === queryHash)) return;
        if (resolvedQueryReceipt) return;
        if (queryReceiptRemote.isFetching || !queryReceiptRemote.isFetched) return;
        router.replace(pathname || "/activity");
    }, [pathname, queryHash, queryReceiptRemote.isFetched, queryReceiptRemote.isFetching, resolvedQueryReceipt, router, txlist]);

    const formatter = useCallback(
        (txs?: TransactionReceipt[]) =>
            txs?.map((tx) => {
                const date = (format(tx?.time, "date") as string).split(" ");
                return {
                    style: { padding: "1.5em" },
                    onClick: () => openDetail(tx),
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
                                                                        : t("activity.category.transaction", { no: tx?.no ? ` ${tx.no}` : "" })}
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
        [color, openDetail, t],
    );

    return (
        <Layouts.Contents.InnerContent>
            <Layouts.Row gap={1} fix style={{ overflow: "auto hidden" }}>
                <Layouts.Row gap={0} fix>
                    <Controls.Tab iconLeft={sortArrow(sorts.blockNumber)} onClick={() => setSort(sorts.blockNumber)}>
                        {t("activity.block.number")}
                    </Controls.Tab>
                    <Controls.Tab iconLeft={sortArrow(sorts.action)} onClick={() => setSort(sorts.action)}>
                        {t("activity.action")}
                    </Controls.Tab>
                    <Controls.Tab iconLeft={sortArrow(sorts.status)} onClick={() => setSort(sorts.status)}>
                        {t("activity.status")}
                    </Controls.Tab>
                    <Controls.Tab iconLeft={sortArrow(sorts.time)} onClick={() => setSort(sorts.time)}>
                        {t("activity.time")}
                    </Controls.Tab>
                    <Controls.Tab iconLeft={sortArrow(sorts.gas)} onClick={() => setSort(sorts.gas)}>
                        {t("activity.gas.used")}
                    </Controls.Tab>
                </Layouts.Row>
            </Layouts.Row>
            <Layouts.Divider />
            <Layouts.List list={filter(sorting(txlist), props?.filter)} formatter={formatter} fill />
        </Layouts.Contents.InnerContent>
    );
}
