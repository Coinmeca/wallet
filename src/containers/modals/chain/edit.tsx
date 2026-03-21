"use client";

import { useState } from "react";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { Modal } from "@coinmeca/ui/containers";
import { CoinmecaWalletContextProvider, useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { dehydrate, HydrationBoundary, QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "api";
import { parseNumber } from "@coinmeca/ui/lib/utils";
import { Chain } from "@coinmeca/wallet-sdk/types";
import { parseChainId, valid } from "@coinmeca/wallet-sdk/utils";
import { useTranslate } from "hooks";
import { chainLogo } from "utils";

export interface Edit {
    chain?: Chain;
    onClose: Function;
    close?: boolean;
}

export default function Edit(props: Edit) {
    const client = getQueryClient();

    return (
        <CoinmecaWalletContextProvider>
            <QueryClientProvider {...{ client }}>
                <HydrationBoundary state={dehydrate(client)}>
                    <ChainEditModal {...props} />
                </HydrationBoundary>
            </QueryClientProvider>
        </CoinmecaWalletContextProvider>
    );
}

const ChainEditModal = (props: any) => {
    const { provider } = useCoinmecaWalletProvider();
    const { t } = useTranslate();
    const targetChainId = typeof props?.chain?.chainId !== "undefined" && valid.chainId(props.chain.chainId) ? parseChainId(props.chain.chainId) : undefined;
    const runtimeChain =
        typeof targetChainId === "number"
            ? provider?.chains?.find((item: Chain) => typeof item?.chainId !== "undefined" && parseChainId(item.chainId) === targetChainId)
            : undefined;

    const [error, setError] = useState<any>();
    const [chain, setChain] = useState<Chain>({
        ...(runtimeChain || props?.chain),
        blockExplorerUrls: !(runtimeChain || props?.chain)?.blockExplorerUrls ? [""] : (runtimeChain || props?.chain)?.blockExplorerUrls,
    });

    const handleClose = (e: any) => {
        props?.onClose(e);
    };

    const handleChainId = (id?: string) => {
        const chainId = parseNumber(id);
        setChain((state: any) => ({ ...state, chainId }));
        if (error?.chainId?.state) setError((state: any) => ({ ...state, chainId: { state: false } }));
    };

    const handleChainName = (chainName?: string) => {
        setChain((state: any) => ({ ...state, chainName }));
        if (error?.chainName?.state) setError((state: any) => ({ ...state, chainName: { state: false } }));
    };

    const handleRpcUrl = (url?: string, index?: number) => {
        setChain((state: any) => {
            const rpcUrls = [...(state?.rpcUrls || [])];

            if (index !== undefined) rpcUrls[index] = url ? url : ""; // Update the URL at the given index
            else if (url) rpcUrls.push(url); // Add new URL if `index` is undefined

            return { ...state, rpcUrls }; // Filter out empty values
            // return { ...state, rpcUrls: rpcUrls.filter(Boolean) }; // Filter out empty values
        });

        if (index !== undefined)
            setError((state: any) => {
                const rpcUrls = { ...state?.rpcUrls };

                if (url || url !== "")
                    rpcUrls[index] =
                        url && /^https?:\/\/|^wss?:\/\//.test(url)
                            ? { state: false }
                            : {
                                  state: true,
                                  message: t("modal.chain.validation.rpc.invalid"),
                              };

                return { ...state, rpcUrls };
            });
    };

    const handleExplorerUrl = (url?: string, index?: number) => {
        setChain((state: any) => {
            const blockExplorerUrls = [...(state?.blockExplorerUrls || [])];

            if (index !== undefined) blockExplorerUrls[index] = url ? url : "";
            else if (url) blockExplorerUrls.push(url); // Add new URL if `index` is undefined
            return { ...state, blockExplorerUrls }; // Filter out empty values
            // return { ...state, blockExplorerUrls: rpcUrls.filter(Boolean) }; // Filter out empty values
        });

        if (index !== undefined)
            setError((state: any) => {
                const blockExplorerUrls = { ...state?.blockExplorerUrls };

                if (url || url !== "")
                    blockExplorerUrls[index] =
                        url && /^https?:\/\/|^wss?:\/\//.test(url)
                            ? { state: false }
                            : {
                                  state: true,
                                  message: t("modal.chain.validation.explorer.invalid"),
                              };

                return { ...state, blockExplorerUrls };
            });
    };

    const handleCurrencyName = (name?: string) => {
        setChain((state: any) => ({ ...state, nativeCurrency: { ...state?.nativeCurrency, name } }));
        if (error?.name?.state) setError((state: any) => ({ ...state, name: { state: false } }));
    };

    const handleCurrencySymbol = (symbol?: string) => {
        setChain((state: any) => ({ ...state, nativeCurrency: { ...state?.nativeCurrency, symbol } }));
        if (error?.symbol?.state) setError((state: any) => ({ ...state, symbol: { state: false } }));
    };

    const handleCurrencyDecimals = (decimal?: string) => {
        const decimals = parseNumber(decimal);
        setChain((state: any) => ({ ...state, nativeCurrency: { ...state?.nativeCurrency, decimals } }));
        if (error?.decimals?.state) setError((state: any) => ({ ...state, decimals: { state: false } }));
    };

    const handleSave = (e: any) => {
        let error: any = {};
        const sourceRpcUrls = Array.isArray(chain?.rpcUrls) ? chain.rpcUrls : [];
        const sourceExplorerUrls = Array.isArray(chain?.blockExplorerUrls) ? chain.blockExplorerUrls : [];
        const c = {
            ...chain,
            chainName: chain?.chainName?.trim(),
            rpcUrls: sourceRpcUrls.map((url: string) => (typeof url === "string" ? url.trim() : "")).filter((url: string) => !!url),
            blockExplorerUrls: sourceExplorerUrls
                .map((url: string) => (typeof url === "string" ? url.trim() : ""))
                .filter((url: string) => !!url),
            nativeCurrency: {
                ...chain?.nativeCurrency,
                name: chain?.nativeCurrency?.name?.trim(),
                symbol: chain?.nativeCurrency?.symbol?.trim(),
            },
        };

        if (!c?.chainId || c?.chainId?.toString() === "" || isNaN(Number(c?.chainId)))
            error.chainId = { state: true, message: t("modal.chain.validation.id.invalid") };
        if (!c?.chainName || !c?.chainName?.trim())
            error.chainName = { state: true, message: t("modal.chain.validation.name.invalid") };
        if (!c?.rpcUrls?.length)
            error.rpcUrls = { general: { state: true, message: t("modal.chain.validation.rpc.required") } };
        else
            sourceRpcUrls.forEach((url: string, index: number) => {
                const normalizedUrl = typeof url === "string" ? url.trim() : "";
                if (normalizedUrl && !/^https?:\/\/|^wss?:\/\//.test(normalizedUrl))
                    error.rpcUrls = {
                        ...error.rpcUrls,
                        [index]: { state: true, message: t("modal.chain.validation.rpc.invalid.short") },
                    };
            });
        if (sourceExplorerUrls.length)
            sourceExplorerUrls.forEach((url: string, index: number) => {
                const normalizedUrl = typeof url === "string" ? url.trim() : "";
                if (normalizedUrl && !/^https?:\/\/|^wss?:\/\//.test(normalizedUrl))
                    error.blockExplorerUrls = {
                        ...error.blockExplorerUrls,
                        [index]: {
                            state: true,
                            message: t("modal.chain.validation.explorer.invalid.short"),
                        },
                    };
            });
        if (!c?.nativeCurrency?.name || c?.nativeCurrency?.name === "" || !c?.nativeCurrency?.name.trim())
            error.name = { state: true, message: t("modal.chain.validation.currency.name.required") };
        if (!c?.nativeCurrency?.symbol || c?.nativeCurrency?.symbol === "" || !c?.nativeCurrency?.symbol.trim())
            error.symbol = { state: true, message: t("modal.chain.validation.currency.symbol.required") };
        if (!c?.nativeCurrency?.decimals || c?.nativeCurrency?.decimals?.toString() === "" || isNaN(c.nativeCurrency.decimals))
            error.decimals = {
                state: true,
                message: t("modal.chain.validation.currency.decimals.invalid"),
            };
        setError(error);

        if (!Object.values(error).some((err: any) => err?.state || Object.values(err)?.some((err: any) => err?.state))) {
            const nextChain = c.blockExplorerUrls?.length ? c : { ...c, blockExplorerUrls: undefined };
            provider?.updateChain(nextChain);
            props?.onClose(e);
        }
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
            buttonArea={
                <Layouts.Row>
                    <Controls.Button onClick={handleClose}>{t("app.btn.close")}</Controls.Button>
                    <Controls.Button onClick={handleSave}>{t("app.btn.save")}</Controls.Button>
                </Layouts.Row>
            }
            close>
            <Layouts.Col gap={2}>
                <Layouts.Col gap={1}>
                    <Elements.Text type={"desc"} align={"left"}>
                        {t("modal.chain.field.id")}
                    </Elements.Text>
                    <Controls.Input
                        type={"number"}
                        value={chain?.chainId}
                        error={error?.chainId?.state}
                        message={{ color: "red", children: error?.chainId?.message }}
                        onChange={(e: any, v: any) => handleChainId(v)}
                    />
                </Layouts.Col>
                <Layouts.Col gap={1}>
                    <Elements.Text type={"desc"} align={"left"}>
                        {t("modal.chain.field.name")}
                    </Elements.Text>
                    <Controls.Input
                        error={error?.chainName?.state}
                        value={chain?.chainName}
                        message={{ color: "red", children: error?.chainName?.message }}
                        onChange={(e: any, v: any) => handleChainName(v)}
                    />
                </Layouts.Col>
                {chain?.rpcUrls?.length && (
                    <>
                        <Layouts.Divider />
                        <Layouts.Col gap={1}>
                            <Elements.Text type={"desc"} align={"left"}>
                                {chain?.rpcUrls?.length > 1
                                    ? t("request.label.chain.rpc.urls")
                                    : t("request.label.chain.rpc.url")}
                            </Elements.Text>
                            <Layouts.Col gap={2}>
                                {chain?.rpcUrls?.map((url: string, i: number) => (
                                    <Layouts.Row gap={1} key={i}>
                                        <Controls.Input
                                            value={url}
                                            error={error?.rpcUrls?.[`${i}`]?.state}
                                            message={{ color: "red", children: error?.rpcUrls?.[`${i}`]?.message }}
                                            onChange={(e: any, v: any) => handleRpcUrl(v, i)}
                                        />
                                        {chain?.rpcUrls?.length > 1 && (
                                            <Controls.Button
                                                icon={"bin"}
                                                style={{ maxHeight: "max-content" }}
                                                onClick={() =>
                                                    setChain((state) => {
                                                        if (state?.rpcUrls?.length > 1)
                                                            return { ...state, rpcUrls: state?.rpcUrls?.filter((_, idx) => i !== idx) };
                                                        else {
                                                            setError((error: any) => ({
                                                                ...error,
                                                                rpcUrls: [{ state: true, message: t("modal.chain.validation.rpc.required") }],
                                                            }));
                                                            return state;
                                                        }
                                                    })
                                                }
                                                fit
                                            />
                                        )}
                                    </Layouts.Row>
                                ))}
                            </Layouts.Col>
                        </Layouts.Col>
                        <Controls.Button
                            iconLeft={"plus-small-bold"}
                            onClick={() => setChain((state: any) => ({ ...state, rpcUrls: [...(state?.rpcUrls || []), ""] }))}>
                            {t("modal.chain.action.rpc.add")}
                        </Controls.Button>
                    </>
                )}
                <Layouts.Divider />
                <Layouts.Col gap={1}>
                    <Elements.Text type={"desc"} align={"left"}>
                        {chain?.blockExplorerUrls?.length && chain?.blockExplorerUrls?.length > 1
                            ? t("modal.chain.field.explorer.urls")
                            : t("modal.chain.field.explorer.url")}
                    </Elements.Text>
                    <Layouts.Col gap={2}>
                        {chain?.blockExplorerUrls?.map((url: string, i: number) => (
                            <Layouts.Row gap={1} key={i}>
                                <Controls.Input
                                    value={url}
                                    error={error?.blockExplorerUrls?.[`${i}`]?.state}
                                    message={{ color: "red", children: error?.blockExplorerUrls?.[`${i}`]?.message }}
                                    onChange={(e: any, v: any) => handleExplorerUrl(v, i)}
                                />
                                {chain?.blockExplorerUrls?.length && chain?.blockExplorerUrls?.length > 1 && (
                                    <Controls.Button
                                        icon={"bin"}
                                        style={{ maxHeight: "max-content" }}
                                        onClick={() =>
                                            setChain((state) =>
                                                state?.blockExplorerUrls?.length && state?.blockExplorerUrls?.length > 1
                                                    ? { ...state, blockExplorerUrls: state?.blockExplorerUrls?.filter((_, idx) => i !== idx) }
                                                    : { ...state, blockExplorerUrls: [""] },
                                            )
                                        }
                                        fit
                                    />
                                )}
                            </Layouts.Row>
                        ))}
                    </Layouts.Col>
                </Layouts.Col>
                <Controls.Button
                    iconLeft={"plus-small-bold"}
                    onClick={() => setChain((state: any) => ({ ...state, blockExplorerUrls: [...(state?.blockExplorerUrls || []), ""] }))}>
                    {t("modal.chain.action.explorer.add")}
                </Controls.Button>
                <Layouts.Divider />
                <Layouts.Col gap={1}>
                    <Elements.Text type={"desc"} align={"left"}>
                        {t("request.label.native.currency.name")}
                    </Elements.Text>
                    <Controls.Input
                        value={chain?.nativeCurrency?.name}
                        error={error?.name?.state}
                        message={{ color: "red", children: error?.name?.message }}
                        onChange={(e: any, v: any) => handleCurrencyName(v)}
                    />
                </Layouts.Col>
                <Layouts.Col gap={1}>
                    <Elements.Text type={"desc"} align={"left"}>
                        {t("request.label.native.currency.symbol")}
                    </Elements.Text>
                    <Controls.Input
                        value={chain?.nativeCurrency?.symbol}
                        error={error?.symbol?.state}
                        message={{ color: "red", children: error?.symbol?.message }}
                        onChange={(e: any, v: any) => handleCurrencySymbol(v)}
                    />
                </Layouts.Col>
                <Layouts.Col gap={1}>
                    <Elements.Text type={"desc"} align={"left"}>
                        {t("request.label.native.currency.decimals")}
                    </Elements.Text>
                    <Controls.Input
                        type={"number"}
                        value={chain?.nativeCurrency?.decimals}
                        error={error?.decimals?.state}
                        message={{ color: "red", children: error?.decimals?.message }}
                        onChange={(e: any, v: any) => handleCurrencyDecimals(v)}
                    />
                </Layouts.Col>
            </Layouts.Col>
        </Modal>
    );
};
