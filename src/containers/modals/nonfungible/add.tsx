"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { Modal } from "@coinmeca/ui/containers";
import { CoinmecaWalletContextProvider, useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { dehydrate, HydrationBoundary, QueryClientProvider } from "@tanstack/react-query";

import { getQueryClient } from "api";
import { States } from "@coinmeca/ui/components/contents";
import { GetErc721 } from "api/erc721";

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
                    <NonFungibleAddModal {...props} />
                </HydrationBoundary>
            </QueryClientProvider>
        </CoinmecaWalletContextProvider>
    );
}

function NonFungibleAddModal(props: Add) {
    const { provider, chain, account } = useCoinmecaWalletProvider();

    const [validate, setValidate] = useState<{ address?: Validate; id?: Validate } | undefined>({ address: { state: false }, id: { state: false } });

    const [token, setToken] = useState<{ address?: string; id?: string }>();
    const [fetch, setFetch] = useState<{ address?: string; id?: string }>();
    
    const [loading, setLoading] = useState<boolean>(false);
    const [process, setProcess] = useState<boolean | null>(null);
    const [error, setError] = useState<string>();

    const [tokens, getToken] = GetErc721("https://sepolia-rollup.arbitrum.io/rpc", fetch?.address && fetch?.id ? { [fetch.address]: [fetch.id] } : undefined);
    const asset = getToken(token?.address, token?.id);
    const pattern = {
        address: /^[a-zA-Z0-9]+$/,
        number: /^[0-9]+$/,
    };

    const handleValidateAddress = (a?: string) => {
        if (token?.address === a || asset?.isFetching) return;
        let check: Validate = { state: false };
        if (!!a && a !== "" && a !== "0" && a !== "0x") {
            if (!a?.startsWith("0x")) check = { state: true, message: "The typed a form of a Token Contract is Invalid." };
            else if (!pattern.address.test(a)) check = { state: true, message: "The unacceptable charater is used in a form." };
            else if (a?.length < 42) check = { state: true, message: "The a is too short." };
            else if (a?.length > 42) check = { state: true, message: "The a is too long." };
        }
        setValidate((state) => ({ ...state, address: check }));
        if (token?.address !== a) setToken((state) => ({ ...state, address: a === "" ? undefined : a }));
    };

    const handleValidateId = (id?: string) => {
        let check: Validate = { state: false };
        if (!!id && id !== "" && id !== "0" && id !== "0x") {
            if (!pattern.number.test(id)) check = { state: true, message: "The unacceptable charater is used in a form." };
            if (isNaN(Number(id))) check = { state: true, message: "The token ID is invalid format." };
        }
        setValidate((state) => ({ ...state, id: check }));
        if (token?.id !== id) setToken((state) => ({ ...state, id: id === "" ? undefined : id }));
    };

    const handleAddToken = (e: any) => {
        try {
            provider?.addNonFungibleAsset(asset?.data?.address!, asset?.data?.tokenId!);
            props?.onClose?.(e);
        } catch (error) {
            console.log(error);
            setProcess(false);
        }
    };

    const handleClose = (e: any) => {
        props?.onClose?.(e);
    };

    useEffect(() => {
        const address = token?.address;
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
    }, [token?.address]);

    useEffect(() => {
        if (process === null) {
            if (loading) {
                if (asset?.isSuccess) {
                    if (asset?.data?.isInvalid) {
                        setError("The provided address does not appear to be a valid NFT contract address. Please verify the address and try again.");
                        setProcess(false);
                    } else if (asset?.data?.owner?.toLowerCase() !== account?.address?.toLowerCase()) {
                        setError("This account does not own this NFT. Please ensure the owner's address of the token.");
                        setProcess(false);
                    } else {
                        setProcess(true);
                    }
                    setLoading(false);
                } else if (asset?.isError) {
                    setError("The data fetching is failed.");
                    setProcess(false);
                    setLoading(false);
                };
            }
        }
    }, [asset, tokens]);

    console.log("fetching",asset?.isFetching,"isLoading",asset?.isLoading,{process, loading})

    return (
        <Modal
            title={!asset ? "Add Token" : "Token Information"}
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
                                                setToken({});
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
                                                        onChange={(e: any, v: string) => handleValidateAddress(v)}
                                                        value={token?.address}
                                                        error={validate?.address?.state}
                                                        lock={asset?.isFetching || asset?.data}
                                                        message={{
                                                            color: "red",
                                                            children: validate?.address?.message,
                                                        }}
                                                        left={
                                                            asset?.isFetching || asset?.data
                                                                ? {
                                                                      children: (
                                                                          <Elements.Icon
                                                                              icon={asset ? "check-bold" : validate?.address?.state ? "x" : "loading"}
                                                                              color={asset && "green"}
                                                                              style={{
                                                                                  ...(!asset?.data && !validate?.id?.state && { opacity: 0.45 }),
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
                                                        Token ID
                                                    </Elements.Text>
                                                    <Controls.Input
                                                        placeholder={"#"}
                                                        type={"number"}
                                                        align={"right"}
                                                        onChange={(e: any, v: string) => handleValidateId(v)}
                                                        value={token?.id}
                                                        error={validate?.id?.state}
                                                        lock={asset?.isFetching || asset?.data}
                                                        message={{
                                                            color: "red",
                                                            children: validate?.id?.message,
                                                        }}
                                                        left={
                                                            asset?.isFetching || asset?.data
                                                                ? {
                                                                      children: (
                                                                          <Elements.Icon
                                                                              icon={asset?.data ? "check-bold" : validate?.id?.state ? "x" : "loading"}
                                                                              color={asset?.data && "green"}
                                                                              style={{
                                                                                  ...(!asset?.data && !validate?.id?.state && { opacity: 0.45 }),
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
                                            <Controls.Button onClick={() => {
                                                setLoading(true);
                                                setFetch(token);
                                            }}>Comfirm</Controls.Button>
                                        </Layouts.Row>
                                    </Layouts.Col>
                                ),
                            },
                            {
                                active: loading,
                                children: (
                                    <States.Loading message={"Please wait until the processing is complete."} />
                                )
                            },
                            {
                                active: !!process,
                                children: (
                                    <Layouts.Col>
                                        {asset?.data && (
                                            <Layouts.Col align={"center"}>
                                                <Image
                                                    width={0}
                                                    height={0}
                                                    src={asset?.isLoading ? require("../../../assets/animation/loading.gif") : asset?.data?.image}
                                                    alt={asset?.data?.tokenId || ""}
                                                    style={{ width: "100%", height: "100%", maxHeight: "50vh" }}
                                                />
                                                <Layouts.Col gap={1}>
                                                    {asset?.data?.url?.name && (
                                                        <Elements.Text type={"h6"} height={0}>
                                                            {asset?.data?.url?.name}
                                                        </Elements.Text>
                                                    )}
                                                    {asset?.data?.tokenId && (
                                                        <Elements.Text height={0}>
                                                            <Elements.Text opacity={0.3}># </Elements.Text>
                                                            {asset?.data?.tokenId}
                                                        </Elements.Text>
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
