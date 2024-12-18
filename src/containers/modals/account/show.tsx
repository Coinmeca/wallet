"use client";

import CryptoJS from "crypto-js";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { Modal } from "@coinmeca/ui/containers";
import { Parts } from "@coinmeca/ui/index";
import { CoinmecaWalletContextProvider, useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { dehydrate, HydrationBoundary, QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "api";
import { Lock } from "containers/stages";
import { useEffect, useState } from "react";
import { useGuard } from "hooks";
import { GuardProvider } from "contexts/guard";

export interface Show {
    onClose: Function;
    close?: boolean;
}

export default function Show(props: Show) {
    const client = getQueryClient();

    return (
        <CoinmecaWalletContextProvider>
            <GuardProvider>
                <QueryClientProvider {...{ client }}>
                    <HydrationBoundary state={dehydrate(client)}>
                        <AccountShowModal {...props} />
                    </HydrationBoundary>
                </QueryClientProvider>
            </GuardProvider>
        </CoinmecaWalletContextProvider>
    );
}

const AccountShowModal = (props: any) => {
    const { provider } = useCoinmecaWalletProvider();
    const { setIsAccess } = useGuard();

    const [unlock, setUnlock] = useState(false);

    const handleClose = (e: any) => {
        props?.onClose(e);
    };

    const handleUnlock = (code: string) => {
        try {
            if (provider?.unlock(code)) setUnlock(true);
            else {
                provider?.lock();
                window.location.reload();
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <Modal
            {...props}
            title={"Account Info Show"}
            style={{ "--black": "255,255,255", "--white": "255,255,255", "--dim": "32,32,32" }}
            onClose={handleClose}
            fullsize
            close>
            <Layouts.Contents.InnerContent scroll={false}>
                <Layouts.Col gap={2} fill>
                    <Layouts.Contents.InnerContent>
                        <Layouts.Col gap={0} style={{ minHeight: "max-content" }} fill>
                            <Layouts.Contents.SlideContainer
                                contents={[
                                    {
                                        active: !unlock,
                                        children: <Lock onUnlock={handleUnlock} />,
                                    },
                                    {
                                        active: unlock,
                                        children: <></>,
                                    },
                                ]}
                            />
                        </Layouts.Col>
                    </Layouts.Contents.InnerContent>
                    <Controls.Button onClick={handleClose}>Close</Controls.Button>
                </Layouts.Col>
            </Layouts.Contents.InnerContent>
        </Modal>
    );
};
