"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { Modal } from "@coinmeca/ui/containers";
import { CoinmecaWalletContextProvider, useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { dehydrate, HydrationBoundary, QueryClientProvider } from "@tanstack/react-query";

import { getQueryClient } from "api";
import { GetErc20 } from "api/erc20";
import { States } from "@coinmeca/ui/components/contents";
import { format } from "@coinmeca/ui/lib/utils";

export interface Add {
    standard?: any;
    onAsset?: Function;
    onProcess?: Function;
    onBack?: Function;
    onClose: Function;
    close?: boolean;
}

interface Validate {
    state?: boolean;
    message?: string;
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
    const { provider, chain, account } = useCoinmecaWalletProvider();

    const [address, setAddress] = useState<string>();
    const [validate, setValidate] = useState<Validate | undefined>({ state: false });

    const [token, setToken] = useState<string>();
    const [loading, setLoading] = useState<boolean>(false);
    const [process, setProcess] = useState<boolean | null>(null);
    const [error, setError] = useState<string>();

    const [tokens, getToken] = GetErc20("https://sepolia-rollup.arbitrum.io/rpc", [token], account?.address);
    const asset = getToken(address);
    const pattern = /^[a-zA-Z0-9]+$/;

    const handleValidate = (a?: string) => {
        if (address === a || asset?.isFetching) return;
        let check: Validate = { state: false };
        if (!!a && a !== "" && a !== "0" && a !== "0x") {
            if (!a?.startsWith("0x")) check = { state: true, message: "The typed a form of a Token Contract is Invalid." };
            else if (!pattern.test(a)) check = { state: true, message: "The unacceptable charater is used in a form." };
            else if (a?.length < 42) check = { state: true, message: "The a is too short." };
            else if (a?.length > 42) check = { state: true, message: "The a is too long." };
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
        console.log(1);
        if (process === null) {
            console.log(2);
            if (loading || !asset?.isFetching && !asset?.isLoading) {
                console.log(3);
                if (asset?.isSuccess) {
                     console.log(4);
                     setProcess(true);
                     setLoading(false);
                } else if (asset?.isError) {
                    console.log(5);
                    setProcess(false);
                    setLoading(false);
                }
            } else {
                console.log(6);
                if (asset?.isFetching || asset?.isLoading) {
                    console.log(7);
                    setProcess(null);
                    setLoading(true);
                }
            }
        }
    }, [asset, tokens]);
    console.log("isLoading", asset?.isLoading, "fetching", asset?.isFetching, {loading, process})

    return (
        <Modal
            title={!tokens ? "Add Token" : "Token Information"}
            content={
                <Layouts.Col gap={2} fill>
                    <Layouts.Contents.SlideContainer
                        contents={[
                            {
                                active: process === false,
                                children: (
                                    <States.Failure message={error || "Processing has failed."}>
                                        <Controls.Button
                                            onClick={(e: any) => {
                                                setToken(undefined);
                                                setProcess(null);
                                            }}
                                        >
                                            Go Back
                                        </Controls.Button>
                                    </States.Failure>
                                )
                            },
                            {
                                active: process === null && !loading,
                                children: (
                                    <Layouts.Col gap={2}>
                                        <Elements.Text height={2} opacity={0.6} align={"center"}>
                                            Please enter the token address to be added.
                                        </Elements.Text>
                                        <Layouts.Contents.InnerContent scroll>
                                            <Layouts.Col gap={2}>
                                                <Layouts.Col gap={1}>
                                                    <Elements.Text type={"desc"} align={"left"}>
                                                        Token Address
                                                    </Elements.Text>
                                                    <Controls.Input
                                                        placeholder={"0xA1z2b3Y4C5x6d7E8..."}
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
                                            <Controls.Button onClick={handleClose}>Close</Controls.Button>
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
                                                        src={`https://web3.coinmeca.net/${chain?.chainId}/${asset?.data?.address?.toLowerCase()}/logo.svg`}
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
                                                    {(asset?.data?.decimals && asset?.data?.balance) && (
                                                        <div style={{ padding: "2em", background: "rgba(var(--white),0.05)" }}>
                                                            <Layouts.Row gap={1}>
                                                                <Elements.Text opacity={0.3} fit>
                                                                    Balance
                                                                </Elements.Text>
                                                                <Layouts.Row gap={1} align={"right"} style={{ maxWidth:"100%" }} fix>
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
                                                    )}
                                                </Layouts.Col>
                                            </Layouts.Col>
                                        )}
                                        <Layouts.Row gap={2} fix>
                                            <Controls.Button onClick={handleClose}>Cancel</Controls.Button>
                                            <Controls.Button onClick={handleAddToken} type={"glass"}>
                                                Add {asset?.data?.symbol}
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
