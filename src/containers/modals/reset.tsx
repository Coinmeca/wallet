"use client";

import { useRouter } from "next/navigation";
import { Controls } from "@coinmeca/ui/components";
import { Modal } from "@coinmeca/ui/containers";
import { CoinmecaWalletContextProvider, useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { dehydrate, HydrationBoundary, QueryClientProvider } from "@tanstack/react-query";

import { getQueryClient } from "api";
import { useTranslate } from "hooks";

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
    const { t } = useTranslate();

    const handleClose = (e: any) => {
        props?.onClose?.(e);
    };

    const handleReset = (e: any) => {
        props?.onReset?.(e);
    };

    return (
        <Modal
            title={t("modal.reset.title")}
            message={t("modal.reset.message")}
            buttonArea={
                <>
                    <Controls.Button onClick={handleClose}>{t("app.btn.no")}</Controls.Button>
                    <Controls.Button onClick={handleReset}>{t("app.btn.yes")}</Controls.Button>
                </>
            }
            onClose={handleClose}
            close
        />
    );
}
