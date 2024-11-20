"use client";

import { useCallback, useMemo, useState } from "react";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { Modal } from "@coinmeca/ui/containers";
import { CoinmecaWalletContextProvider, useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { dehydrate, HydrationBoundary, QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "api";
import { Account } from "@coinmeca/wallet-sdk/types";

export interface Fungible {
    standard?: any;
    onAsset?: Function;
    onProcess?: Function;
    onBack?: Function;
    onClose: Function;
    close?: boolean;
}

export default function Approval(props: Fungible) {
    const client = getQueryClient();

    return (
        <CoinmecaWalletContextProvider>
            <QueryClientProvider {...{ client }}>
                <HydrationBoundary state={dehydrate(client)}>
                    <ApprovalManageModal {...props} />
                </HydrationBoundary>
            </QueryClientProvider>
        </CoinmecaWalletContextProvider>
    );
}

const ApprovalManageModal = (props: any) => {
    const { provider } = useCoinmecaWalletProvider();

    const [name, setName] = useState<string>();
    const [error, setError] = useState<any>();
    const [init, setInit] = useState<any>(false);

    const handleClose = (e: any) => {
        props?.onClose(e);
    };

    const handleChange = (name?: string) => {
    };

    const handleSave = (e: any) => {
    };

    const accounts = useMemo(() => provider?.accounts(props?.app?.url),[provider, props?.app?.url])
    const acocuntList = useCallback((accounts:string[]) => accounts?.map((address: string, i:number) => {
        const account = provider?.account(address);
        return {
            key: i,
            onClick: () => {},
            style: { padding: "2.5em clamp(2em, 5%, 8em)" },
            children: [
                [
                    [
                        {
                            style: { overflow: "hidden" },
                            children: [
                                {
                                    gap: 2,
                                    children: [
                                        {
                                            fit: true,
                                            children: (
                                                <Elements.Avatar
                                                    // color={colorMap}
                                                    scale={1.25}
                                                    size={2.5}
                                                    // display={6}
                                                    // ellipsis={" ... "}
                                                    character={`${(account?.index || 0) + 1}`}
                                                    name={account?.address}
                                                    stroke={0.2}
                                                    hideName
                                                />
                                            ),
                                        },
                                        {
                                            gap: 0,
                                            children: [
                                                <>
                                                    <Elements.Text size={1.5} height={1.5} title={account?.name} fix>
                                                        {account?.name}
                                                    </Elements.Text>
                                                </>,
                                                <>
                                                    <Elements.Text
                                                        size={1.375}
                                                        height={1.5}
                                                        weight={"light"}
                                                        opacity={0.6}
                                                        title={account?.address}
                                                        fix>
                                                        {account?.address?.substring(0, account?.address?.startsWith("0x") ? 8 : 6) +
                                                            " ... " +
                                                            account?.address?.substring(account?.address?.length - 6, account?.address?.length)}
                                                    </Elements.Text>
                                                </>,
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                ],
            ],
        };
    }), [accounts]);

    console.log({ accounts });

    return (
        <Modal {...props} title={"Manage approvals"} onClose={handleClose} close>
            <Layouts.Col gap={2}>
                <Layouts.List list={accounts} formatter={acocuntList} />
                <Layouts.Row>
                    <Controls.Button onClick={handleClose}>Cancel</Controls.Button>
                    <Controls.Button onClick={handleSave}>Save</Controls.Button>
                </Layouts.Row>
            </Layouts.Col>
        </Modal>
    );
};
