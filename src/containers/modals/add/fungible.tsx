"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { Modals } from "@coinmeca/ui/containers";
import { CoinmecaWalletContextProvider, useCoinmecaWalletProvider } from "@coinmeca/wallet-sdk/contexts";
import { dehydrate, HydrationBoundary, QueryClientProvider } from "@tanstack/react-query";

import { getQueryClient } from "api";
import { GetErc20 } from "api/erc20";
import { Asset } from "types";

export interface Fungible {
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

export default function Fungible(props: Fungible) {
    const client = getQueryClient();

    return (
        <CoinmecaWalletContextProvider>
            <QueryClientProvider {...{ client }}>
                <HydrationBoundary state={dehydrate(client)}>
                    <AddFungibleModal {...props} />
                </HydrationBoundary>
            </QueryClientProvider>
        </CoinmecaWalletContextProvider>
    );
}

function AddFungibleModal(props: Fungible) {
    const { provider, chain, account } = useCoinmecaWalletProvider();

    const [address, setAddress] = useState<string>();
    const [validate, setValidate] = useState<Validate | undefined>({ state: false });

    const [token, setToken] = useState<string>();
    const [loading, setLoading] = useState<boolean>(false);
    const [process, setProcess] = useState<boolean | null>(null);

    const { data: tokens, isFetching, isLoading, isError } = GetErc20("https://sepolia-rollup.arbitrum.io/rpc", [token], account?.address);
    const asset = useMemo(() => tokens && Object.values(tokens)?.[0], [tokens]);

    const pattern = /^[a-zA-Z0-9]+$/;

    const handleValidate = (a?: string) => {
        console.log(a);
        if (address === a || isFetching) return;
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
        provider?.addFungibleAsset(asset?.address);
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
        if ((isFetching || isLoading) && !tokens) {
            setProcess(null);
            setLoading(true);
        }
        // else if (!loading && tokens) {
        // setLoading(false);
        // setProcess(true);
        // } else if (isError) {
        // setLoading(false);
        // setProcess(false);
        // }
    }, [isFetching, isLoading, isError, tokens, loading]);

    return (
        <Modals.Process
            process={process}
            title={!tokens ? "Add Token" : "Token Information"}
            content={
                <Layouts.Col gap={2} fill>
                    <Layouts.Contents.SlideContainer
                        contents={[
                            {
                                active: !tokens,
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
                                                        message={{
                                                            color: "red",
                                                            children: validate?.message,
                                                        }}
                                                        left={
                                                            isFetching || (address && tokens?.[address])
                                                                ? {
                                                                      children: (
                                                                          <Elements.Icon
                                                                              icon={
                                                                                  address && tokens?.[address]
                                                                                      ? "check-bold"
                                                                                      : validate?.state
                                                                                      ? "x"
                                                                                      : "loading"
                                                                              }
                                                                              color={address && tokens?.[address] && "green"}
                                                                              style={{
                                                                                  ...(!(address && tokens?.[address]) && !validate?.state && { opacity: 0.45 }),
                                                                              }}
                                                                          />
                                                                      ),
                                                                  }
                                                                : {
                                                                      style: { maxWidth: 0, opacity: 0 },
                                                                  }
                                                        }
                                                        right={
                                                            address && address?.length > 0
                                                                ? {
                                                                      style: { pointerEvents: "initial" },
                                                                      children: (
                                                                          <Controls.Button
                                                                              icon={"x"}
                                                                              onClick={() => {
                                                                                  setAddress("");
                                                                              }}
                                                                          />
                                                                      ),
                                                                  }
                                                                : undefined
                                                        }
                                                        autoFocus
                                                        lock={isFetching || (address && tokens?.[address])}
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
                                active: !!tokens,
                                children: (
                                    <Layouts.Col>
                                        {tokens &&
                                            Object.values(tokens)?.map((t: Asset, i: number) => (
                                                <Layouts.Col key={i} align={"center"}>
                                                    <Image
                                                        src={`https://web3.coinmeca.net/${chain?.chainId || 421614}/${asset?.address?.toLowerCase()}/logo.svg`}
                                                        width={0}
                                                        height={0}
                                                        alt={asset?.symbol}
                                                        style={{ width: "6em", height: "6em" }}
                                                    />
                                                    <Layouts.Col gap={1}>
                                                        <Elements.Text type={"h6"} height={0}>
                                                            {t?.symbol}
                                                        </Elements.Text>
                                                        <Elements.Text type={"strong"} height={0} opacity={0.6}>
                                                            {t?.name}
                                                        </Elements.Text>
                                                        {/* <Elements.Text >{t?.decimals}</Elements.Text> */}
                                                        {t?.balance && <Elements.Text>{t.balance / 10 ** (t?.decimals || 1)}</Elements.Text>}
                                                    </Layouts.Col>
                                                </Layouts.Col>
                                            ))}
                                        <Layouts.Row gap={2} fix>
                                            <Controls.Button onClick={handleClose}>Cancel</Controls.Button>
                                            <Controls.Button onClick={handleAddToken} type={"glass"}>
                                                Add {asset?.symbol}
                                            </Controls.Button>
                                        </Layouts.Row>
                                    </Layouts.Col>
                                ),
                            },
                        ]}
                    />
                </Layouts.Col>
            }
            failure={{
                message: "Processing has failed.",
                children: <Controls.Button onClick={(e: any) => {}}>Go Back</Controls.Button>,
            }}
            loading={{
                active: loading,
                message: "Please wait until the processing is complete.",
            }}
            success={{
                message: "Processing succeeded.",
                children: <Controls.Button onClick={(e: any) => {}}>OK</Controls.Button>,
            }}
            onClose={handleClose}
            close
        />
    );
}
