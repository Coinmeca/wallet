"use client";

import { useState } from "react";
import { Contents, Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { Modal } from "@coinmeca/ui/containers";
import { CoinmecaWalletContextProvider, useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { dehydrate, HydrationBoundary, QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "api";

export interface Remove {
    onClose: Function;
    close?: boolean;
}

export default function Remove(props: Remove) {
    const client = getQueryClient();

    return (
        <CoinmecaWalletContextProvider>
            <QueryClientProvider {...{ client }}>
                <HydrationBoundary state={dehydrate(client)}>
                    <ChainRemoveModal {...props} />
                </HydrationBoundary>
            </QueryClientProvider>
        </CoinmecaWalletContextProvider>
    );
}

const ChainRemoveModal = (props: any) => {
    const { provider } = useCoinmecaWalletProvider();

    const handleRemove = (e: any) => {
        provider?.removeEthereumChain(props?.chain);
        props?.onClose(e);
    };

    const handleClose = (e: any) => {
        props?.onClose(e);
    };

    return (
        <Modal {...props} title={"Manage approvals"} onClose={handleClose} close>
            <Layouts.Col gap={2}>
                <Contents.States.Warn
                    message={
                        <Elements.Text opacity={0.6}>
                            Are you sure you want to remove this chain's information? The chain's information will be deleted, but its usage history will
                            remain.
                        </Elements.Text>
                    }
                />
                <Layouts.Row>
                    <Controls.Button onClick={handleClose}>NO</Controls.Button>
                    <Controls.Button onClick={handleRemove}>YES</Controls.Button>
                </Layouts.Row>
            </Layouts.Col>
        </Modal>
    );
};
