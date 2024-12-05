"use client";

import { useRouter } from "next/navigation";
import { Controls } from "@coinmeca/ui/components";
import { Modal } from "@coinmeca/ui/containers";
import { CoinmecaWalletContextProvider, useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { dehydrate, HydrationBoundary, QueryClientProvider } from "@tanstack/react-query";

import { getQueryClient } from "api";

export interface Add {
    onReset?: Function;
    onClose: Function;
    close?: boolean;
}

export default function Reset(props: Add) {
    const client = getQueryClient();

    return (
        <CoinmecaWalletContextProvider>
            <QueryClientProvider {...{ client }}>
                <HydrationBoundary state={dehydrate(client)}>
                    <ResetModal {...props} />
                </HydrationBoundary>
            </QueryClientProvider>
        </CoinmecaWalletContextProvider>
    );
}

function ResetModal(props: Add) {
    const handleClose = (e: any) => {
        props?.onClose?.(e);
    };

    const handleReset = (e: any) => {
        props?.onReset?.(e);
    };

    return (
        <Modal
            title={"Reset Confirmation"}
            message={"Setup the all configuration from the first. Are you sure?"}
            buttonArea={
                <>
                    <Controls.Button onClick={handleClose}>NO</Controls.Button>
                    <Controls.Button onClick={handleReset}>YES</Controls.Button>
                </>
            }
            onClose={handleClose}
            close
        />
    );
}
