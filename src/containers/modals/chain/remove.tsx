"use client";

import { Contents, Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { Modal } from "@coinmeca/ui/containers";
import { CoinmecaWalletContextProvider, useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { dehydrate, HydrationBoundary, QueryClientProvider } from "@tanstack/react-query";
import { Chain } from "@coinmeca/wallet-sdk/types";
import { parseChainId, valid } from "@coinmeca/wallet-sdk/utils";
import { getQueryClient } from "api";
import { useTranslate } from "hooks";
import { chainLogo } from "utils";

export interface Remove {
    chain?: Chain;
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
    const { t } = useTranslate();
    const targetChainId = typeof props?.chain?.chainId !== "undefined" && valid.chainId(props.chain.chainId) ? parseChainId(props.chain.chainId) : undefined;
    const chain =
        typeof targetChainId === "number"
            ? provider?.chains?.find((item: Chain) => typeof item?.chainId !== "undefined" && parseChainId(item.chainId) === targetChainId) || props?.chain
            : props?.chain;

    const handleRemove = (e: any) => {
        provider?.removeEthereumChain(chain || props?.chain);
        props?.onClose(e);
    };

    const handleClose = (e: any) => {
        props?.onClose(e);
    };

    return (
        <Modal {...props} title={t("modal.chain.remove.title")} onClose={handleClose} close>
            <Layouts.Col gap={2}>
                {chain && (
                    <Layouts.Row gap={1} align={"middle"} fit>
                        <Elements.Avatar size={1.5} img={chainLogo(chain?.chainId, chain?.logo)} style={{ maxWidth: "max-content" }} />
                        <Layouts.Col gap={0.25} fit>
                            <Elements.Text size={1} align={"left"}>
                                {chain?.chainName}
                            </Elements.Text>
                            <Elements.Text type={"desc"} opacity={0.6} align={"left"}>
                                {chain?.rpcUrls?.[0]}
                            </Elements.Text>
                        </Layouts.Col>
                    </Layouts.Row>
                )}
                <Contents.States.Warn
                    message={
                        <Elements.Text opacity={0.6}>
                            {t("modal.chain.remove.message")}
                        </Elements.Text>
                    }
                />
                <Layouts.Row>
                    <Controls.Button onClick={handleClose}>{t("app.btn.no")}</Controls.Button>
                    <Controls.Button onClick={handleRemove}>{t("app.btn.yes")}</Controls.Button>
                </Layouts.Row>
            </Layouts.Col>
        </Modal>
    );
};
