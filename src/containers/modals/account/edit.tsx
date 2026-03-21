"use client";

import { useState } from "react";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { Modal } from "@coinmeca/ui/containers";
import { CoinmecaWalletContextProvider, useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { dehydrate, HydrationBoundary, QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "api";
import { useTranslate } from "hooks";

export interface Fungible {
    standard?: any;
    onAsset?: Function;
    onProcess?: Function;
    onBack?: Function;
    onClose: Function;
    close?: boolean;
}

export default function Edit(props: Fungible) {
    const client = getQueryClient();

    return (
        <CoinmecaWalletContextProvider>
            <QueryClientProvider {...{ client }}>
                <HydrationBoundary state={dehydrate(client)}>
                    <AccountEditModal {...props} />
                </HydrationBoundary>
            </QueryClientProvider>
        </CoinmecaWalletContextProvider>
    );
}

const AccountEditModal = (props: any) => {
    const account = props?.account;
    const { provider } = useCoinmecaWalletProvider();
    const { t } = useTranslate();
    const currentAccount = account?.address ? provider?.account(account.address) || account : account;

    const [name, setName] = useState<string>();
    const [error, setError] = useState<any>();
    const [init, setInit] = useState<any>(false);

    const handleClose = (e: any) => {
        props?.onClose(e);
    };

    const handleChange = (name?: string) => {
        if (init) {
            name = name?.trim();
            setName(name);
            if (!name || !name?.length || name === "") setError({ state: true, message: t("modal.account.edit.error.blank") });
            else setError({ state: false });
        } else if (name?.length) setInit(true);
    };

    const handleSave = (e: any) => {
        if (name && name !== "" && name?.length) {
            provider?.updateAccount({ ...currentAccount, name });
            handleClose(e);
        } else setError({ state: true, message: t("modal.account.edit.error.blank") });
    };

    return (
        <Modal {...props} title={t("modal.account.edit.title")} onClose={handleClose} close>
            <Layouts.Col gap={2}>
                <Layouts.Row gap={1.5} fix>
                    <Elements.Avatar
                        scale={1.25}
                        size={3}
                        stroke={0.2}
                        character={`${currentAccount?.index + 1}`}
                        name={name?.length ? name : currentAccount?.name}
                        style={{ maxWidth: "max-content" }}
                        hideName
                    />
                    <Layouts.Col gap={0} align={"left"} style={{ overflow: "hidden" }}>
                        <Elements.Text height={0} size={1.5}>
                            {name?.length ? name : currentAccount?.name}
                        </Elements.Text>
                        <Elements.Text height={0} opacity={0.6} fix>
                            {currentAccount?.address}
                        </Elements.Text>
                    </Layouts.Col>
                </Layouts.Row>
                <Controls.Input
                    placeholder={t("modal.account.edit.desc")}
                    type={"text"}
                    length={20}
                    onChange={(e: any, v: string) => handleChange(v)}
                    error={error?.state}
                    message={{
                        color: "red",
                        children: error?.message,
                    }}
                />
                <Layouts.Row>
                    <Controls.Button onClick={handleClose}>{t("app.btn.cancel")}</Controls.Button>
                    <Controls.Button onClick={handleSave}>{t("app.btn.save")}</Controls.Button>
                </Layouts.Row>
            </Layouts.Col>
        </Modal>
    );
};
