"use client";

import { useCallback, useState } from "react";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { Modal } from "@coinmeca/ui/containers";
import { CoinmecaWalletContextProvider, useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { dehydrate, HydrationBoundary, QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "api";
import { short, site, valid } from "utils";
import { useTranslate } from "hooks";

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
    const [accounts, setAccounts] = useState<string[]>((props?.app?.accounts || []).filter((item: any) => typeof item === "string"));
    const info = site(props?.app?.url);
    const { t } = useTranslate();
    const title = props?.app?.name || info?.host || info?.origin || t("app.sidebar.app.unknown");

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
                const approvedAddress = typeof address === "string" ? address : "";
                const runtimeAddress = valid.address(approvedAddress) ? approvedAddress : undefined;
                const account = runtimeAddress ? provider?.account(runtimeAddress) : undefined;
                const displayAddress = account?.address || runtimeAddress || approvedAddress;
                const displayName = account?.name || short(displayAddress) || displayAddress;
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
                                                            character={`${typeof account?.index === "number" ? account.index + 1 : i + 1}`}
                                                            name={displayAddress}
                                                            stroke={0.2}
                                                            hideName
                                                        />
                                                    ),
                                                },
                                                {
                                                    gap: 0,
                                                    children: [
                                                        <>
                                                            <Elements.Text size={1.5} height={1.5} title={displayName} fix>
                                                                {displayName}
                                                            </Elements.Text>
                                                        </>,
                                                        <>
                                                            <Elements.Text
                                                                size={1.375}
                                                                height={1.5}
                                                                weight={"light"}
                                                                opacity={0.6}
                                                                title={displayAddress}
                                                                fix>
                                                                {short(displayAddress)}
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
                                                                        state?.filter((a) => a?.toLowerCase() !== approvedAddress?.toLowerCase()),
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
        [provider],
    );

    return (
        <Modal
            {...props}
            title={<Elements.Avatar scale={0.625} size={2.25} style={{ justifyContent: "center" }} img={props?.app?.logo} name={title} />}
            message={
                accounts?.length
                    ? t("modal.app.approval.message.has.accounts", {
                          title,
                          origin: info?.origin || props?.app?.url || "",
                      })
                    : t("modal.app.approval.message.none", {
                          title,
                          origin: info?.origin || props?.app?.url || "",
                      })
            }
            onClose={handleClose}
            close>
            <Layouts.Col gap={2}>
                <Layouts.Col style={{ minHeight: "2em" }}>{accounts?.length ? <Layouts.List list={accounts} formatter={accountList} /> : <></>}</Layouts.Col>
                <Layouts.Row>
                    <Controls.Button onClick={handleClose}>{t("app.btn.cancel")}</Controls.Button>
                    <Controls.Button onClick={handleSave}>{t("app.btn.save")}</Controls.Button>
                </Layouts.Row>
            </Layouts.Col>
        </Modal>
    );
};
