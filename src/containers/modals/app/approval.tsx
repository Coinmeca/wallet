"use client";

import { useCallback, useState } from "react";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { Modal } from "@coinmeca/ui/containers";
import { CoinmecaWalletContextProvider, useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { dehydrate, HydrationBoundary, QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "api";
import { short } from "utils";

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
                    <ApprovalManageModal {...props} />
                </HydrationBoundary>
            </QueryClientProvider>
        </CoinmecaWalletContextProvider>
    );
}

const ApprovalManageModal = (props: any) => {
    const { provider } = useCoinmecaWalletProvider();
    const [accounts, setAccounts] = useState(props?.app?.accounts || []);

    const handleClose = (e: any) => {
        props?.onClose(e);
    };

    const handleSave = (e: any) => {
        if (accounts?.length) provider?.updateApp({ ...props?.app, accounts });
        else provider?.revokeApp(props?.app?.url);
        handleClose(e);
    };

    const accountList = useCallback(
        (accounts: string[]) =>
            accounts?.map((address: string, i: number) => {
                const account = provider?.account(address);
                return {
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
                                                                {short(account?.address)}
                                                            </Elements.Text>
                                                        </>,
                                                    ],
                                                },
                                                {
                                                    fit: true,
                                                    children: [
                                                        <>
                                                            <Controls.Button
                                                                icon={"x"}
                                                                onClick={() =>
                                                                    setAccounts((state: string[]) =>
                                                                        state?.filter((a) => a?.toLowerCase() !== account?.address?.toLowerCase()),
                                                                    )
                                                                }
                                                            />
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
            }),
        [provider, accounts],
    );

    return (
        <Modal
            {...props}
            title={<Elements.Avatar scale={0.625} size={2.25} style={{ justifyContent: "center" }} img={props?.app?.logo} name={props?.app?.name} />}
            message={accounts?.length ? "Accounts that have approved use of this app." : "No accounts that have approved use of this app."}
            onClose={handleClose}
            close>
            <Layouts.Col gap={2}>
                <Layouts.Col style={{ minHeight: "2em" }}>{accounts?.length ? <Layouts.List list={accounts} formatter={accountList} /> : <></>}</Layouts.Col>
                <Layouts.Row>
                    <Controls.Button onClick={handleClose}>Cancel</Controls.Button>
                    <Controls.Button onClick={handleSave}>Save</Controls.Button>
                </Layouts.Row>
            </Layouts.Col>
        </Modal>
    );
};
