"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { Modal } from "@coinmeca/ui/containers";
import { parseChainId } from "@coinmeca/wallet-provider/chains";
import { CoinmecaWalletContextProvider, useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { dehydrate, HydrationBoundary, QueryClientProvider } from "@tanstack/react-query";

import { getQueryClient } from "api";
import { GetErc20 } from "api/erc20";
import { States } from "@coinmeca/ui/components/contents";
import { format } from "@coinmeca/ui/lib/utils";
import { useTranslate } from "hooks";
import { Validate } from "types";
import { tokenLogo, valid } from "utils";

export interface Add {
    standard?: any;
    onAsset?: Function;
    onProcess?: Function;
    onBack?: Function;
    onClose: Function;
    close?: boolean;
}

export default function Add(props: Add) {
    const client = getQueryClient();

    return (
        <CoinmecaWalletContextProvider>
            <QueryClientProvider {...{ client }}>
                <HydrationBoundary state={dehydrate(client)}>
                    <FungibleAddModal {...props} />
                </HydrationBoundary>
            </QueryClientProvider>
        </CoinmecaWalletContextProvider>
    );
}

function FungibleAddModal(props: Add) {
    const { provider } = useCoinmecaWalletProvider();
    const { t } = useTranslate();
    const activeAddress = provider?.address;
    const activeChainId = useMemo(() => {
        const providerChainId = provider?.chainId;
        return typeof providerChainId !== "undefined" && valid.chainId(providerChainId) ? parseChainId(providerChainId) : undefined;
    }, [provider?.chainId]);
    const activeChain = useMemo(
        () =>
            typeof activeChainId === "number"
                ? provider?.chains?.find((item: any) => typeof item?.chainId !== "undefined" && parseChainId(item.chainId) === activeChainId)
                : undefined,
        [activeChainId, provider?.chains],
    );

    const [address, setAddress] = useState<string>();
    const [validate, setValidate] = useState<Validate | undefined>({ state: false });

    const [token, setToken] = useState<string>();
    const [loading, setLoading] = useState<boolean>(false);
    const [process, setProcess] = useState<boolean | null>(null);
    const [error, setError] = useState<string>();

    const [tokens, getToken] = GetErc20(activeChain?.rpcUrls?.[0], [token], activeAddress);
    const asset = getToken(address);
    const pattern = /^[a-zA-Z0-9]+$/;

    const handleValidate = (a?: string) => {
        if (address === a || asset?.isFetching) return;
        let check: Validate = { state: false };
        if (!!a && a !== "" && a !== "0" && a !== "0x") {
            if (!a?.startsWith("0x")) check = { state: true, message: t("modal.fungible.error.address.invalid") };
            else if (!pattern.test(a)) check = { state: true, message: t("modal.fungible.error.character.invalid") };
            else if (a?.length < 42) check = { state: true, message: t("modal.fungible.error.address.short") };
            else if (a?.length > 42) check = { state: true, message: t("modal.fungible.error.address.long") };
        }
        setValidate(check);
        if (address !== a) setAddress(() => (a === "" ? undefined : a));
    };

    const handleAddToken = (e: any) => {
        provider?.addFungibleAsset(asset?.data?.address);
        props?.onClose?.(e);
    };

    const handleClose = (e: any) => {
        props?.onClose?.(e);
    };

    useEffect(() => {
        if (
            !!address &&
            address !== "" &&
            address !== "0" &&
            address !== "0x" &&
            address?.length === 42 &&
            pattern.test(address) &&
            address?.startsWith("0x") &&
            address !== token
        )
            setToken(address);
    }, [address]);

    useEffect(() => {
        if (process === null) {
            if (loading || (!asset?.isFetching && !asset?.isLoading)) {
                if (asset?.data?.isInvalid || asset?.isError) {
                    setError(asset?.data?.message || asset?.error?.message);
                    setProcess(false);
                    setLoading(false);
                } else if (asset?.isSuccess) {
                    setProcess(true);
                    setLoading(false);
                }
            } else {
                if (asset?.isFetching || asset?.isLoading) {
                    setProcess(null);
                    setLoading(true);
                }
            }
        }
    }, [asset, tokens]);

    return (
        <Modal
            title={!asset ? t("modal.fungible.add.title") : t("modal.fungible.info.title")}
            content={
                <Layouts.Col gap={2} fill>
                    <Layouts.Contents.SlideContainer
                        contents={[
                            {
                                active: process === false,
                                children: (
                                    <States.Failure message={error || t("modal.fungible.error.processing")}>
                                        <Controls.Button
                                            onClick={(e: any) => {
                                                setToken(undefined);
                                                setProcess(null);
                                            }}>
                                            {t("app.btn.go.back")}
                                        </Controls.Button>
                                    </States.Failure>
                                ),
                            },
                            {
                                active: process === null && !loading,
                                children: (
                                    <Layouts.Col gap={2}>
                                        <Elements.Text height={2} opacity={0.6} align={"center"}>
                                            {t("modal.fungible.desc")}
                                        </Elements.Text>
                                        <Layouts.Contents.InnerContent scroll>
                                            <Layouts.Col gap={2}>
                                                <Layouts.Col gap={1}>
                                                    <Elements.Text type={"desc"} align={"left"}>
                                                        {t("modal.fungible.field.address")}
                                                    </Elements.Text>
                                                    <Controls.Input
                                                        placeholder={t("modal.fungible.placeholder.address")}
                                                        onChange={(e: any, v: string) => handleValidate(v)}
                                                        value={address}
                                                        error={validate?.state}
                                                        lock={asset?.isFetching || (address && asset?.data)}
                                                        message={{
                                                            color: "red",
                                                            children: validate?.message,
                                                        }}
                                                        left={
                                                            asset?.isFetching || (address && asset)
                                                                ? {
                                                                      children: (
                                                                          <Elements.Icon
                                                                              icon={address && asset ? "check-bold" : validate?.state ? "x" : "loading"}
                                                                              color={address && asset && "green"}
                                                                              style={{
                                                                                  ...(!(address && asset) && !validate?.state && { opacity: 0.45 }),
                                                                              }}
                                                                          />
                                                                      ),
                                                                  }
                                                                : {
                                                                      style: { maxWidth: 0, opacity: 0 },
                                                                  }
                                                        }
                                                        // right={
                                                        //     address && address?.length > 0
                                                        //         ? {
                                                        //               style: { pointerEvents: "initial" },
                                                        //               children: (
                                                        //                   <Controls.Button
                                                        //                       icon={"x"}
                                                        //                       onClick={() => {
                                                        //                           setAddress("");
                                                        //                       }}
                                                        //                   />
                                                        //               ),
                                                        //           }
                                                        //         : undefined
                                                        // }
                                                        clearable
                                                        autoFocus
                                                    />
                                                </Layouts.Col>
                                            </Layouts.Col>
                                        </Layouts.Contents.InnerContent>
                                        <Layouts.Row gap={2} fix>
                                            <Controls.Button onClick={handleClose}>{t("app.btn.close")}</Controls.Button>
                                        </Layouts.Row>
                                    </Layouts.Col>
                                ),
                            },
                            {
                                active: loading,
                                children: <States.Loading />,
                            },
                            {
                                active: !!process,
                                children: (
                                    <Layouts.Col>
                                        {asset?.data && (
                                            <Layouts.Col>
                                                <Layouts.Col gap={2} align={"center"}>
                                                    <Image
                                                        src={tokenLogo(activeChain?.chainId, asset?.data?.address) || ""}
                                                        width={0}
                                                        height={0}
                                                        alt={asset?.data?.symbol}
                                                        style={{ width: "6em", height: "6em" }}
                                                    />
                                                    <Layouts.Col gap={0}>
                                                        <Elements.Text type={"h6"} height={0}>
                                                            {asset?.data?.symbol}
                                                        </Elements.Text>
                                                        <Elements.Text type={"strong"} height={0} opacity={0.6}>
                                                            {asset?.data?.name}
                                                        </Elements.Text>
                                                    </Layouts.Col>
                                                </Layouts.Col>
                                                <Layouts.Col gap={6}>
                                                    {asset?.data?.decimals && asset?.data?.balance ? (
                                                        <div style={{ padding: "2em", background: "rgba(var(--white),0.05)" }}>
                                                            <Layouts.Row gap={1}>
                                                                <Elements.Text opacity={0.3} fit>
                                                                    {t("asset.balance")}
                                                                </Elements.Text>
                                                                <Layouts.Row gap={1} align={"right"} style={{ maxWidth: "100%" }} fix>
                                                                    <Elements.Text align={"right"} fix>
                                                                        {format(asset?.data.balance, "currency", {
                                                                            unit: 9,
                                                                            limit: 12,
                                                                            fix: 9,
                                                                        })}
                                                                    </Elements.Text>
                                                                    <Elements.Text align={"left"} opacity={0.6} case={"upper"} fit>
                                                                        {asset?.data?.symbol}
                                                                    </Elements.Text>
                                                                </Layouts.Row>
                                                            </Layouts.Row>
                                                        </div>
                                                    ) : (
                                                        <></>
                                                    )}
                                                </Layouts.Col>
                                            </Layouts.Col>
                                        )}
                                        <Layouts.Row gap={2} fix>
                                            <Controls.Button onClick={handleClose}>{t("app.btn.cancel")}</Controls.Button>
                                            <Controls.Button onClick={handleAddToken} type={"glass"}>
                                                {t("modal.fungible.btn.add", { symbol: asset?.data?.symbol || "" })}
                                            </Controls.Button>
                                        </Layouts.Row>
                                    </Layouts.Col>
                                ),
                            },
                        ]}
                    />
                </Layouts.Col>
            }
            onClose={handleClose}
            close
        />
    );
}
