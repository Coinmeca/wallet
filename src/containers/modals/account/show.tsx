"use client";

import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { Modal } from "@coinmeca/ui/containers";
import { CoinmecaWalletContextProvider, useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { dehydrate, HydrationBoundary, QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "api";
import { Lock } from "containers/stages";
import { useEffect, useRef, useState } from "react";
import { GuardProvider } from "contexts/guard";
import { useTranslate } from "hooks";
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
    const pass = useRef("");

    const { windowSize } = useWindowSize();
    const { provider } = useCoinmecaWalletProvider();
    const { addToast } = useNotification();
    const { t } = useTranslate();
    const [unlock, setUnlock] = useState(false);
    const [show, setShow] = useState(false);
    const currentAccount = props?.address ? provider?.account(props.address) || props : props;
    const currentAddress = currentAccount?.address || props?.address;
    const currentIndex = typeof currentAccount?.index === "number" ? currentAccount.index : props?.index;
    const currentName = currentAccount?.name || props?.name || currentAddress || "";

    const handleClose = (e: any) => {
        props?.onClose(e);
    };

    const handleUnlock = async (code: string) => {
        try {
            pass.current = code;
            if (await provider?.unlock(code)) {
                const privateKey = provider ? await provider.getPrivateKey({ code: pass.current, index: currentIndex, address: currentAddress }) : undefined;
                if (!privateKey) return false;
                key.current = privateKey;
                pass.current = "";
                setUnlock(true);
                return true;
            }
        } catch (e) {
            if (!!provider?.locked.remain) provider?.lock();
            console.error(e);
        }
        return false;
    };

    const handleCopy = async () => {
        await navigator.clipboard
            .writeText(key.current)
            .then(function () {
                addToast({
                    title: t("modal.account.show.copy"),
                    message: t("modal.account.show.copy.success", { name: currentName }),
                });
            })
            .catch(function () {
                addToast({
                    title: t("modal.account.show.copy"),
                    message: t("modal.account.show.copy.failure", { name: currentName }),
                });
            });
    };

    useEffect(() => {
        return () => {
            pass.current = "";
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
            title={t("modal.account.show.title")}
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
                                                                        {t("modal.account.show.warning.title")}
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
                                                                            {t("modal.account.show.warning.0")}
                                                                        </li>
                                                                        <li>{t("modal.account.show.warning.1")}</li>
                                                                        <li>
                                                                            {t("modal.account.show.warning.2")}
                                                                        </li>
                                                                        <li>{t("modal.account.show.warning.3")}</li>
                                                                        <li>{t("modal.account.show.warning.4")}</li>
                                                                    </ol>
                                                                </Elements.Text>
                                                            </Layouts.Col>
                                                        </Layouts.Box>
                                                    </Layouts.Col>
                                                    <Layouts.Col align={"left"} gap={1}>
                                                        <Elements.Text type={"desc"}>{t("modal.account.show.label")}</Elements.Text>
                                                        <Layouts.Box padding={2} style={{ background: "rgba(var(--white), .05)" }} fit>
                                                            <Layouts.Col gap={1}>
                                                                <Elements.Text align={"left"} weight={"light"} style={{ fontFamily: "monospace" }}>
                                                                    {show ? key.current : key.current?.replace(/./g, "•")}
                                                                </Elements.Text>
                                                                <Controls.Button iconLeft={show ? "hide" : "show"} onClick={() => setShow(!show)}>
                                                                    {show ? t("app.btn.hide") : t("app.btn.show")}
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
                        <Controls.Button onClick={handleClose}>{t("app.btn.close")}</Controls.Button>
                        <AnimatePresence>
                            {key.current && key.current !== "" && (
                                <motion.div
                                    initial={{ marginLeft: "-2em", maxWidth: 0 }}
                                    animate={{ marginLeft: 0, maxWidth: "100vw" }}
                                    exit={{ marginLeft: 0, maxWidth: "100vw" }}
                                    transition={{ ease: "easeInOut", duration: 0.3 }}>
                                    <Controls.Button iconLeft={"copy"} onClick={handleCopy} style={{ width: "100%" }}>
                                        {t("modal.account.show.copy")}
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
