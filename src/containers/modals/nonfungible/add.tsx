"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { Modals } from "@coinmeca/ui/containers";
import { CoinmecaWalletContextProvider, useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { dehydrate, HydrationBoundary, QueryClientProvider } from "@tanstack/react-query";

import { getQueryClient } from "api";
import { GetErc20 } from "api/erc20";
import { States } from "@coinmeca/ui/components/contents";
import { GetErc721 } from "api/erc721";

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

export default function Add(props: Fungible) {
    const client = getQueryClient();

    return (
        <CoinmecaWalletContextProvider>
            <QueryClientProvider {...{ client }}>
                <HydrationBoundary state={dehydrate(client)}>
                    <NonFungibleAddModal {...props} />
                </HydrationBoundary>
            </QueryClientProvider>
        </CoinmecaWalletContextProvider>
    );
}

function NonFungibleAddModal(props: Fungible) {
    const { provider, chain, account } = useCoinmecaWalletProvider();

    const [address, setAddress] = useState<string>();
    const [validate, setValidate] = useState<{ address?: Validate; id?: Validate } | undefined>({ address: { state: false }, id: { state: false } });

    const [token, setToken] = useState<{ address?: string; id?: string }>();
    const [loading, setLoading] = useState<boolean>(false);
    const [process, setProcess] = useState<boolean | null>(null);

    const [tokens, getToken] = GetErc721("https://sepolia-rollup.arbitrum.io/rpc", token?.address && token?.id ? { [token.address]: [token.id] } : undefined);
    const asset = getToken(address);
    const pattern = {
        address: /^[a-zA-Z0-9]+$/,
        number: /^[0-9]+$/,
    };

    const handleValidateAddress = (a?: string) => {
        if (address === a || asset?.isFetching) return;
        let check: Validate = { state: false };
        if (!!a && a !== "" && a !== "0" && a !== "0x") {
            if (!a?.startsWith("0x")) check = { state: true, message: "The typed a form of a Token Contract is Invalid." };
            else if (!pattern.address.test(a)) check = { state: true, message: "The unacceptable charater is used in a form." };
            else if (a?.length < 42) check = { state: true, message: "The a is too short." };
            else if (a?.length > 42) check = { state: true, message: "The a is too long." };
        }
        setValidate((state) => ({ ...state, address: check }));
        if (address !== a) setToken((state) => ({ ...state, address: a === "" ? undefined : a }));
    };

    const handleValidateId = (a?: string) => {
        let check: Validate = { state: false };
        if (!!a && a !== "" && a !== "0" && a !== "0x") {
            if (!pattern.number.test(a)) check = { state: true, message: "The unacceptable charater is used in a form." };
        }
        setValidate((state) => ({ ...state, id: check }));
        if (address !== a) setToken((state) => ({ ...state, id: a === "" ? undefined : a }));
    };

    const handleAddToken = (e: any) => {
        provider?.addNonFungibleAsset(token?.address!, token?.id!);
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
            pattern.address.test(address) &&
            address?.startsWith("0x") &&
            address !== token
        )
            setToken((state) => ({ ...state, address }));
    }, [address]);

    useEffect(() => {
        if ((asset?.isFetching || asset?.isLoading) && !tokens) {
            setProcess(null);
            setLoading(true);
        }
        if (loading && asset?.isSuccess && tokens) {
            setLoading(false);
        }
        // else if (!loading && tokens) {
        // setLoading(false);
        // setProcess(true);
        // } else if (isError) {
        // setLoading(false);
        // setProcess(false);
        // }
    }, [asset?.isFetching, asset?.isLoading, asset?.isError, asset?.isSuccess, tokens, loading]);
    console.log({ asset });

    return (
        <Modals.Process
            process={process}
            title={!tokens ? "Add Token" : "Token Information"}
            content={
                <Layouts.Col gap={2} fill>
                    <Layouts.Contents.SlideContainer
                        contents={[
                            {
                                active: !asset?.data,
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
                                                        onChange={(e: any, v: string) => handleValidateAddress(v)}
                                                        value={address}
                                                        error={validate?.address?.state}
                                                        lock={asset?.isFetching || (address && asset?.data)}
                                                        message={{
                                                            color: "red",
                                                            children: validate?.address?.message,
                                                        }}
                                                        left={
                                                            asset?.isFetching || (address && asset)
                                                                ? {
                                                                      children: (
                                                                          <Elements.Icon
                                                                              icon={
                                                                                  address && asset ? "check-bold" : validate?.address?.state ? "x" : "loading"
                                                                              }
                                                                              color={address && asset && "green"}
                                                                              style={{
                                                                                  ...(!(address && asset) && !validate?.address?.state && { opacity: 0.45 }),
                                                                              }}
                                                                          />
                                                                      ),
                                                                  }
                                                                : {
                                                                      style: { maxWidth: 0, opacity: 0 },
                                                                  }
                                                        }
                                                        clearable
                                                        autoFocus
                                                    />
                                                </Layouts.Col>
                                                <Layouts.Col gap={1}>
                                                    <Elements.Text type={"desc"} align={"left"}>
                                                        Token Id
                                                    </Elements.Text>
                                                    <Controls.Input
                                                        placeholder={""}
                                                        type={"number"}
                                                        align={"right"}
                                                        onChange={(e: any, v: string) => handleValidateId(v)}
                                                        value={address}
                                                        error={validate?.id?.state}
                                                        lock={asset?.isFetching || (address && asset?.data)}
                                                        message={{
                                                            color: "red",
                                                            children: validate?.id?.message,
                                                        }}
                                                        left={
                                                            asset?.isFetching || (address && asset)
                                                                ? {
                                                                      children: (
                                                                          <Elements.Icon
                                                                              icon={address && asset ? "check-bold" : validate?.id?.state ? "x" : "loading"}
                                                                              color={address && asset && "green"}
                                                                              style={{
                                                                                  ...(!(address && asset) && !validate?.id?.state && { opacity: 0.45 }),
                                                                              }}
                                                                          />
                                                                      ),
                                                                  }
                                                                : {
                                                                      style: { maxWidth: 0, opacity: 0 },
                                                                  }
                                                        }
                                                        clearPosition="left"
                                                        clearable
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
                                active: !!asset?.data && asset?.isSuccess,
                                children: (
                                    <Layouts.Col>
                                        {asset?.data && (
                                            <Layouts.Col align={"center"}>
                                                <Image
                                                    src={`https://web3.coinmeca.net/${chain?.chainId}/${asset?.data?.address?.toLowerCase()}/logo.svg`}
                                                    width={0}
                                                    height={0}
                                                    alt={asset?.data?.symbol}
                                                    style={{ width: "6em", height: "6em" }}
                                                />
                                                <Layouts.Col gap={1}>
                                                    <Elements.Text type={"h6"} height={0}>
                                                        {asset?.data?.symbol}
                                                    </Elements.Text>
                                                    <Elements.Text type={"strong"} height={0} opacity={0.6}>
                                                        {asset?.data?.name}
                                                    </Elements.Text>
                                                    {/* <Elements.Text >{t?.decimals}</Elements.Text> */}
                                                    {asset?.data?.decimals && asset?.data?.balance ? (
                                                        <Layouts.Row gap={1}>
                                                            <Elements.Text align={"right"}>
                                                                {asset?.data.balance / 10 ** (asset?.data?.decimals || 1)}
                                                            </Elements.Text>
                                                            <Elements.Text align={"left"} opacity={0.6} case={"upper"}>
                                                                {asset?.data?.symbol}
                                                            </Elements.Text>
                                                        </Layouts.Row>
                                                    ) : (
                                                        <></>
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
            failure={{
                message: "Processing has failed.",
                children: <Controls.Button onClick={(e: any) => {}}>Go Back</Controls.Button>,
            }}
            loading={{
                // active: loading,
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
