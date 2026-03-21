"use client";

import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { Modal } from "@coinmeca/ui/containers";
import { CoinmecaWalletContextProvider, useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { dehydrate, HydrationBoundary, QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "api";
import { site } from "utils";
import { useTranslate } from "hooks";

export interface Revoke {
    onClose: Function;
    close?: boolean;
}

export default function Revoke(props: Revoke) {
    const client = getQueryClient();

    return (
        <CoinmecaWalletContextProvider>
            <QueryClientProvider {...{ client }}>
                <HydrationBoundary state={dehydrate(client)}>
                    <AppRevokeModal {...props} />
                </HydrationBoundary>
            </QueryClientProvider>
        </CoinmecaWalletContextProvider>
    );
}
const AppRevokeModal = (props?: any) => {
    const { provider } = useCoinmecaWalletProvider();
    const info = site(props?.app?.url);
    const { t } = useTranslate();
    const title = props?.app?.name || info?.host || info?.origin || t("app.sidebar.app.unknown");

    const handleClose = () => {
        props?.onClose();
    };

    const handleRevokeApp = () => {
        !!props?.app?.url && props?.app?.url !== "" && provider?.revokeApp(props?.app?.url);
        handleClose();
    };

    return (
        <Modal
            title={t("modal.app.revoke.title")}
            message={
                <Layouts.Col gap={0.5}>
                    <Elements.Text>{t("modal.app.revoke.message", { title })}</Elements.Text>
                    <Elements.Text opacity={0.6}>{info?.origin || props?.app?.url}</Elements.Text>
                </Layouts.Col>
            }
            buttonArea={
                <>
                    <Controls.Button onClick={handleClose}>{t("app.btn.no")}</Controls.Button>
                    <Controls.Button onClick={handleRevokeApp}>{t("app.btn.yes")}</Controls.Button>
                </>
            }
            onClose={handleClose}
            close
        />
    );
};
