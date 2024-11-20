"use client";

import { Controls } from "@coinmeca/ui/components";
import { Modal } from "@coinmeca/ui/containers";
import { CoinmecaWalletContextProvider, useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { dehydrate, HydrationBoundary, QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "api";

export interface Approval {
    onClose: Function;
    close?: boolean;
}

export default function Approval(props: Approval) {
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

    const handleClose = () => {
        props?.onClose();
    };

    const handleRevokeApp = () => {
        !!props?.url && props?.url !== "" && provider?.revokeApp(props.url);
        handleClose();
    };

    return (
        <Modal
            title={"Revoke App"}
            message={"Revoke approvals of all accounts for this app. Are you sure?"}
            buttonArea={
                <>
                    <Controls.Button onClick={handleClose}>NO</Controls.Button>
                    <Controls.Button onClick={handleRevokeApp}>YES</Controls.Button>
                </>
            }
            onClose={handleClose}
            close
        />
    );
};
