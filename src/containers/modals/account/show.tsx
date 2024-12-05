"use client";

import CryptoJS from "crypto-js";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { Modal } from "@coinmeca/ui/containers";
import { Parts } from "@coinmeca/ui/index";
import { CoinmecaWalletContextProvider, useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { dehydrate, HydrationBoundary, QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "api";
import { useState } from "react";

export interface Show {
    onClose: Function;
    close?: boolean;
}

export default function Show(props: Show) {
    const client = getQueryClient();

    return (
        <CoinmecaWalletContextProvider>
            <QueryClientProvider {...{ client }}>
                <HydrationBoundary state={dehydrate(client)}>
                    <AccountShowModal {...props} />
                </HydrationBoundary>
            </QueryClientProvider>
        </CoinmecaWalletContextProvider>
    );
}

const AccountShowModal = (props: any) => {
    const width = 64;
    const length = 6;

    const { provider } = useCoinmecaWalletProvider();

    const [unlock, setUnlock] = useState(false);
    const [code, setCode] = useState<string>("");
    const [error, setError] = useState({ state: false, message: "" });

    const handleClose = (e: any) => {
        props?.onClose(e);
    };

    const handleNumberClick = async (code: string) => {
        if (code?.length > length) return;

        setCode(code);
        if (code?.length === length) {
            if (provider?.unlock(CryptoJS.SHA256(code).toString())) {
                setUnlock(true);
            } else {
                setError({ state: true, message: "The entered passcode was wrong." });
            }
        } else setError({ state: false, message: "" });
    };

    return (
        <Modal
            {...props}
            title={"Account Info Show"}
            style={{ "--black": "255,255,255", "--white": "255,255,255", "--dim": "32,32,32" }}
            onClose={handleClose}
            fullsize
            close>
            <Layouts.Contents.InnerContent scroll={false}>
                <Layouts.Col gap={2} fill>
                    <Layouts.Contents.InnerContent>
                        <Layouts.Col gap={0} style={{ minHeight: "max-content" }} fill>
                            <Layouts.Contents.SlideContainer
                                contents={[
                                    {
                                        active: !unlock,
                                        children: (
                                            <Layouts.Contents.SlideContainer
                                                vertical
                                                contents={[
                                                    {
                                                        active: true,
                                                        children: (
                                                            <Layouts.Contents.InnerContent scroll={false}>
                                                                <Layouts.Col gap={4} align={"center"} fill>
                                                                    <Layouts.Col gap={4} align={"center"} fit>
                                                                        <Elements.Text weight={"bold"} size={2}>
                                                                            PASSCODE
                                                                        </Elements.Text>
                                                                        <Elements.Passcode
                                                                            width={width}
                                                                            index={code?.length || 0}
                                                                            length={length}
                                                                            error={error.state}
                                                                            gap={"5%"}
                                                                            effect
                                                                        />
                                                                        {/* {error.message !== "" && (
                                                                <Layouts.Col gap={2} align={"center"}>
                                                                <Elements.Text weight={"bold"} color={"red"}>
                                                                {error.message}
                                                                </Elements.Text>
                                                                <Controls.Button onClick={openResetConfirm} fit>
                                                                Reset Passcode
                                                                </Controls.Button>
                                                                </Layouts.Col>
                                                                )} */}
                                                                    </Layouts.Col>
                                                                </Layouts.Col>
                                                            </Layouts.Contents.InnerContent>
                                                        ),
                                                    },
                                                    {
                                                        active: true,
                                                        children: (
                                                            <Layouts.Contents.SlideContainer
                                                                offset={100}
                                                                vertical
                                                                contents={[
                                                                    {
                                                                        active: false,
                                                                        children: <></>,
                                                                    },
                                                                    {
                                                                        active: true,
                                                                        children: (
                                                                            <Layouts.Contents.InnerContent scroll={false}>
                                                                                <Layouts.Col gap={0} fill>
                                                                                    <Layouts.Col fill>
                                                                                        <Parts.Numberpad
                                                                                            type="code"
                                                                                            width={width}
                                                                                            value={code}
                                                                                            onChange={(e: any, v: any) => handleNumberClick(v)}
                                                                                            style={{ padding: 0 }}
                                                                                            shuffle
                                                                                        />
                                                                                    </Layouts.Col>
                                                                                </Layouts.Col>
                                                                            </Layouts.Contents.InnerContent>
                                                                        ),
                                                                    },
                                                                ]}
                                                            />
                                                        ),
                                                    },
                                                ]}
                                            />
                                        ),
                                    },
                                    {
                                        active: unlock,
                                        children: <></>,
                                    },
                                ]}
                            />
                        </Layouts.Col>
                    </Layouts.Contents.InnerContent>
                    <Controls.Button onClick={handleClose}>Close</Controls.Button>
                </Layouts.Col>
            </Layouts.Contents.InnerContent>
        </Modal>
    );
};
