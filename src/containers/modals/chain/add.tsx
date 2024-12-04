"use client";

import { useState } from "react";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { Modal } from "@coinmeca/ui/containers";
import { CoinmecaWalletContextProvider, useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { dehydrate, HydrationBoundary, QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "api";
import { parseNumber } from "@coinmeca/ui/lib/utils";
import { Chain } from "@coinmeca/wallet-sdk/types";

export interface Add {
    onClose: Function;
    close?: boolean;
}

export default function Add(props: Add) {
    const client = getQueryClient();

    return (
        <CoinmecaWalletContextProvider>
            <QueryClientProvider {...{ client }}>
                <HydrationBoundary state={dehydrate(client)}>
                    <ChainAddModal {...props} />
                </HydrationBoundary>
            </QueryClientProvider>
        </CoinmecaWalletContextProvider>
    );
}

const ChainAddModal = (props: any) => {
    const { provider } = useCoinmecaWalletProvider();
    const [error, setError] = useState<any>();
    const [chain, setChain] = useState<Chain>();

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

    const handleRpcUrl = (url?: string) => {
        setChain((state: any) => ({ ...state, rpcUrls: [url] }));
        if (error?.rpcUrls?.state) setError((state: any) => ({ ...state, rpcUrls: { state: false } }));
    };

    const handleExplorerUrl = (url?: string) => {
        setChain((state: any) => ({ ...state, blockExplorerUrls: [url] }));
        if (error?.blockExplorerUrls?.state) setError((state: any) => ({ ...state, blockExplorerUrls: { state: false } }));
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

    const handleAddChain = (e: any) => {
        let error = {};
        if (!chain?.chainId || isNaN(parseNumber(chain?.chainId)))
            error = { ...error, chainId: { state: true, message: "The given chain ID is invalid number." } };
        if (!chain?.chainName || !chain?.chainName?.length)
            error = { ...error, chainName: { state: true, message: "The given chain name is something wrong." } };
        if (!chain?.rpcUrls || !chain?.rpcUrls?.length) error = { ...error, rpcUrls: { state: true, message: "RPC URL is require." } };
        if (!/^https?:\/\/|^wss:\/\//.test(chain?.rpcUrls?.[0]!))
            error = { ...error, rpcUrls: { state: true, message: "The given rpc url is something wrong." } };
        if (chain?.blockExplorerUrls?.length && chain.blockExplorerUrls?.[0]?.length && !/^https?:\/\/|^wss:\/\//.test(chain.blockExplorerUrls[0]))
            error = { ...error, blockExplorerUrls: { state: true, message: "The given explorer url is something wrong." } };
        if (!chain?.nativeCurrency?.name || !chain?.nativeCurrency?.name?.length)
            error = { ...error, name: { state: true, message: "The given native currency's name is something wrong." } };
        if (!chain?.nativeCurrency?.symbol || !chain?.nativeCurrency?.symbol?.length)
            error = { ...error, symbol: { state: true, message: "The given native currency's symbol is something wrong." } };
        if (!chain?.nativeCurrency?.decimals || isNaN(chain?.nativeCurrency?.decimals))
            error = { ...error, decimals: { state: true, message: "The given chain ID is invalid number." } };

        setError(error);
        if (!Object.values(error)?.some((s: any) => s?.state)) {
            provider?.addEthereumChain(chain!);
            props?.onClose(e);
        }
    };

    return (
        <Modal
            {...props}
            title={"Add New Chain"}
            onClose={handleClose}
            buttonArea={
                <Layouts.Row>
                    <Controls.Button onClick={handleClose}>Close</Controls.Button>
                    <Controls.Button onClick={handleAddChain}>Add</Controls.Button>
                </Layouts.Row>
            }
            close>
            <Layouts.Col gap={2}>
                <Layouts.Col gap={1}>
                    <Elements.Text type={"desc"} align={"left"}>
                        Chain ID
                    </Elements.Text>
                    <Controls.Input
                        type={"number"}
                        error={error?.chainId?.state}
                        message={{ color: "red", children: error?.chainId?.message }}
                        onChange={(e: any, v: any) => handleChainId(v)}
                    />
                </Layouts.Col>
                <Layouts.Col gap={1}>
                    <Elements.Text type={"desc"} align={"left"}>
                        Chain Name
                    </Elements.Text>
                    <Controls.Input
                        error={error?.chainName?.state}
                        message={{ color: "red", children: error?.chainName?.message }}
                        onChange={(e: any, v: any) => handleChainName(v)}
                    />
                </Layouts.Col>
                <Layouts.Col gap={1}>
                    <Elements.Text type={"desc"} align={"left"}>
                        RPC URL
                    </Elements.Text>
                    <Controls.Input
                        error={error?.rpcUrls?.state}
                        message={{ color: "red", children: error?.rpcUrls?.message }}
                        onChange={(e: any, v: any) => handleRpcUrl(v)}
                    />
                </Layouts.Col>
                <Layouts.Col gap={1}>
                    <Elements.Text type={"desc"} align={"left"}>
                        Explorer URL (Optional)
                    </Elements.Text>
                    <Controls.Input
                        error={error?.blockExplorerUrls?.state}
                        message={{ color: "red", children: error?.blockExplorerUrls?.message }}
                        onChange={(e: any, v: any) => handleExplorerUrl(v)}
                    />
                </Layouts.Col>
                <Layouts.Divider />
                <Layouts.Col gap={1}>
                    <Elements.Text type={"desc"} align={"left"}>
                        Name
                    </Elements.Text>
                    <Controls.Input
                        error={error?.name?.state}
                        message={{ color: "red", children: error?.name?.message }}
                        onChange={(e: any, v: any) => handleCurrencyName(v)}
                    />
                </Layouts.Col>
                <Layouts.Col gap={1}>
                    <Elements.Text type={"desc"} align={"left"}>
                        Symbol
                    </Elements.Text>
                    <Controls.Input
                        error={error?.symbol?.state}
                        message={{ color: "red", children: error?.symbol?.message }}
                        onChange={(e: any, v: any) => handleCurrencySymbol(v)}
                    />
                </Layouts.Col>
                <Layouts.Col gap={1}>
                    <Elements.Text type={"desc"} align={"left"}>
                        Decimals
                    </Elements.Text>
                    <Controls.Input
                        type={"number"}
                        error={error?.decimals?.state}
                        message={{ color: "red", children: error?.decimals?.message }}
                        onChange={(e: any, v: any) => handleCurrencyDecimals(v)}
                    />
                </Layouts.Col>
            </Layouts.Col>
        </Modal>
    );
};
