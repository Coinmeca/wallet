"use client";

import CryptoJS from "crypto-js";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { Modal } from "@coinmeca/ui/containers";
import { CoinmecaWalletContextProvider, useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { dehydrate, HydrationBoundary, QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "api";
import { Lock } from "containers/stages";
import { useEffect, useRef, useState } from "react";
import { GuardProvider } from "contexts/guard";
import { encrypt } from "utils";
import { Account } from "@coinmeca/wallet-sdk/types";
import { Notification } from "@coinmeca/ui/contexts";
import { useNotification, useWindowSize } from "@coinmeca/ui/hooks";
import { AnimatePresence, motion } from "motion/react";
import { Root } from "@coinmeca/ui/lib/style";

export interface Show {
    onClose: Function;
    close?: boolean;
}

export default function Show(props: Show) {
    const client = getQueryClient();

    return (
        <CoinmecaWalletContextProvider>
            <GuardProvider>
                <QueryClientProvider {...{ client }}>
                    <HydrationBoundary state={dehydrate(client)}>
                        <Notification>
                            <AccountShowModal {...props} />
                        </Notification>
                    </HydrationBoundary>
                </QueryClientProvider>
            </GuardProvider>
        </CoinmecaWalletContextProvider>
    );
}

const AccountShowModal = (props: any) => {
    const key = useRef("");
    const hash = useRef("");

    const { windowSize } = useWindowSize();
    const { provider } = useCoinmecaWalletProvider();
    const { addToast } = useNotification();
    const [unlock, setUnlock] = useState(false);
    const [show, setShow] = useState(false);

    const handleClose = (e: any) => {
        props?.onClose(e);
    };

    const handleUnlock = (code: string) => {
        try {
            hash.current = CryptoJS.SHA256(code).toString();
            code = "";
            if (provider?.unlock(hash.current)) {
                key.current = provider?.getPrivateKey(
                    encrypt(JSON.stringify({ hash: hash.current, index: props?.index, address: props?.address }), new Date(Math.floor(Date.now())).toString()),
                );
                hash.current = "";
                setUnlock(true);
            }
        } catch (e) {
            if (!!provider?.locked.remain) provider?.lock();
            console.error(e);
        }
    };

    const handleCopy = async (account: Account) => {
        await navigator.clipboard
            .writeText(account.address)
            .then(function () {
                addToast({
                    title: `Copy Private Key`,
                    message: `The private key of ${props.name} was copied.`,
                });
            })
            .catch(function (err) {
                addToast({
                    title: `Copy Address`,
                    message: `Failed to copy the address of ${props.name}.`,
                });
            });
    };

    useEffect(() => {
        return () => {
            hash.current = "";
            key.current = "";
        };
    }, []);

    useEffect(() => {
        provider?.on("lockTimeUpdated", handleClose);
        return () => {
            provider?.off("lockTimeUpdated", handleClose);
        };
    }, [provider]);

    return (
        <Modal
            {...props}
            width={{ max: 66 }}
            title={"Show Private Key"}
            style={{
                "--black": "0,0,0",
                "--white": "255,255,255",
                "--dim": "32,32,32",
            }}
            onClose={handleClose}
            fullsize={windowSize.width <= Root.Device.Mobile}
            close>
            <Layouts.Contents.InnerContent scroll={false}>
                <Layouts.Col gap={2} fill>
                    <Layouts.Contents.InnerContent scroll={false}>
                        <Layouts.Col gap={0} fill>
                            <Layouts.Contents.SlideContainer
                                contents={[
                                    {
                                        active: !unlock,
                                        style: windowSize.width > Root.Device.Mobile ? { height: "60vh", maxHeight: "80em" } : {},
                                        children: (
                                            <Layouts.Contents.InnerContent>
                                                <Lock onUnlock={handleUnlock} isModal />
                                            </Layouts.Contents.InnerContent>
                                        ),
                                    },
                                    {
                                        active: unlock,
                                        children: (
                                            <Layouts.Contents.InnerContent>
                                                <Layouts.Col style={{ height: "100%" }} gap={2}>
                                                    <Layouts.Col style={{ height: "100%" }} fill>
                                                        <Layouts.Box
                                                            padding={2}
                                                            change={"orange"}
                                                            style={{
                                                                background: "rgba(var(--orange), .15)",
                                                                borderLeft: "0.5em solid rgba(var(--orange), .6)",
                                                                maxHeight: "max-content",
                                                            }}
                                                            fit>
                                                            <Layouts.Col gap={1}>
                                                                <Layouts.Row gap={1} align={"middle"}>
                                                                    <Elements.Icon color={"orange"} icon={"exclamation-square"} change />
                                                                    <Elements.Text weight={"bold"} align={"left"} change>
                                                                        Security Warning:
                                                                    </Elements.Text>
                                                                </Layouts.Row>
                                                                <Elements.Text
                                                                    align={"left"}
                                                                    size={1.25}
                                                                    weight={"light"}
                                                                    opacity={0.6}
                                                                    style={{ paddingLeft: "2.5em" }}
                                                                    change>
                                                                    <ol style={{ listStyleType: "square" }}>
                                                                        <li>
                                                                            Keep this private key secure and confidential. Anyone with access to your private
                                                                            key can control your account and funds.
                                                                        </li>
                                                                        <li>Never enter your private key into untrusted websites or applications.</li>
                                                                        <li>
                                                                            If you believe your private key has been compromised, transfer your funds to a new
                                                                            account immediately.
                                                                        </li>
                                                                        <li>Do not store your private key in plain text or unprotected files.</li>
                                                                        <li>Use a secure password manager or write it down and store it in a safe place.</li>
                                                                    </ol>
                                                                </Elements.Text>
                                                            </Layouts.Col>
                                                        </Layouts.Box>
                                                    </Layouts.Col>
                                                    <Layouts.Col align={"left"} gap={1}>
                                                        <Elements.Text type={"desc"}>Your Private Key:</Elements.Text>
                                                        <Layouts.Box padding={2} style={{ background: "rgba(var(--white), .05)" }} fit>
                                                            <Layouts.Col gap={1}>
                                                                <Elements.Text align={"left"} weight={"light"} style={{ fontFamily: "monospace" }}>
                                                                    {show ? key.current : key.current?.replace(/./g, "•")}
                                                                </Elements.Text>
                                                                <Controls.Button iconLeft={show ? "hide" : "show"} onClick={() => setShow(!show)}>
                                                                    {show ? "Hide" : "Show"}
                                                                </Controls.Button>
                                                            </Layouts.Col>
                                                        </Layouts.Box>
                                                    </Layouts.Col>
                                                </Layouts.Col>
                                            </Layouts.Contents.InnerContent>
                                        ),
                                    },
                                ]}
                            />
                        </Layouts.Col>
                    </Layouts.Contents.InnerContent>
                    <Layouts.Row gap={2}>
                        <Controls.Button onClick={handleClose}>Close</Controls.Button>
                        <AnimatePresence>
                            {key.current && key.current !== "" && (
                                <motion.div
                                    initial={{ marginLeft: "-2em", maxWidth: 0 }}
                                    animate={{ marginLeft: 0, maxWidth: "100vw" }}
                                    exit={{ marginLeft: 0, maxWidth: "100vw" }}
                                    transition={{ ease: "easeInOut", duration: 0.3 }}>
                                    <Controls.Button iconLeft={"copy"} onClick={handleCopy} style={{ width: "100%" }}>
                                        Copy
                                    </Controls.Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Layouts.Row>
                </Layouts.Col>
            </Layouts.Contents.InnerContent>
        </Modal>
    );
};
