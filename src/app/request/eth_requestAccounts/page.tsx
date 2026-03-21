"use client";

import Image from "next/image";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { AnimatePresence } from "framer-motion";

import { useRequestApp, useRequestFlow, useTranslate } from "hooks";
import { short } from "utils";
import { RequestCloseNextActions, RequestInvalid } from "../common";

/*
await window.ethereum.providerMap.get("CoinmecaWallet").request({method: 'eth_requestAccounts'})
*/

const method = "eth_requestAccounts";
const timeout = 5000;

export default function Page() {
    const { provider } = useCoinmecaWalletProvider();
    const { t } = useTranslate();
    const { load, id, request, count, level, setLevel, error, setError, resolve, reject, handleClose, handleNext, scheduleClose, settledRef } = useRequestFlow({
        method,
    });
    const isReady = load && !!id && request?.method === method;
    const app = request?.app;
    const selectedAddress = provider?.address;
    const selectedAccount = provider?.account(selectedAddress);
    const { info, title, origin } = useRequestApp(app, t("reqeust.app.unknown"));
    const accountName = selectedAccount?.name || "";
    const accountAddress = short(selectedAccount?.address) || "";

    const handleConnect = async () => {
        const requestPromise = provider?.requestAccounts(app!);
        if (!requestPromise) {
            const cause = "Account approval request could not be started.";
            reject(cause);
            setError(cause);
            setLevel(2);
            return;
        }

        await requestPromise
            .then((result) => {
                if (settledRef.current) return;
                if (!Array.isArray(result) || !result.length) throw new Error("Account approval did not persist.");
                if (!resolve(result)) return;
                setLevel(1);
                scheduleClose(handleClose, timeout);
            })
            .catch((cause) => {
                if (settledRef.current) return;
                reject(cause);
                setError(cause);
                setLevel(2);
            });
    };

    return (
        <AnimatePresence>
            {isReady ? (
                app ? (
                    <Layouts.Contents.SlideContainer
                        contents={[
                            {
                                active: true,
                                children: (
                                    <Layouts.Contents.InnerContent scroll={false}>
                                        <Layouts.Col gap={2} align={"center"} fill>
                                            <Layouts.Contents.InnerContent padding={[4, 4, 0]}>
                                                <Layouts.Col fill>
                                                    <Layouts.Col align={"center"} style={{ flex: 1 }}>
                                                        <Layouts.Col gap={8} align={"center"} fit>
                                                            <div
                                                                style={{
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    maxWidth: "max-content",
                                                                    maxHeight: "max-content",
                                                                    padding: "2em",
                                                                    borderRadius: "100%",
                                                                    background: "rgba(var(--white),.15)",
                                                                }}>
                                                                <Image
                                                                    width={0}
                                                                    height={0}
                                                                    src={
                                                                        level === 0
                                                                            ? app?.logo || ""
                                                                            : require(`../../../assets/animation/${level === 1 ? "success" : "failure"}.gif`)
                                                                    }
                                                                    alt={title}
                                                                    style={{ width: "8em", height: "8em" }}
                                                                />
                                                            </div>
                                                            <Layouts.Col gap={1}>
                                                                <Elements.Text type={"h6"}>{title}</Elements.Text>
                                                                <Elements.Text type={"strong"} opacity={0.6}>
                                                                    {info?.origin || app?.url}
                                                                </Elements.Text>
                                                            </Layouts.Col>
                                                        </Layouts.Col>
                                                    </Layouts.Col>
                                                    <Layouts.Contents.SlideContainer
                                                        style={{ flex: 1 }}
                                                        contents={[
                                                            {
                                                                active: level === 0,
                                                                children: (
                                                                    <Layouts.Col gap={0} align={"center"} style={{ height: "100%" }} fill>
                                                                        <Layouts.Col gap={4} align={"center"} fit>
                                                                            <Elements.Text type={"h3"}>{t("app.wallet.connect")}</Elements.Text>
                                                                            <Elements.Text weight={"bold"} opacity={0.6}>
                                                                                {t("request.accounts.connect.prompt", {
                                                                                    account: accountName,
                                                                                    address: accountAddress,
                                                                                    app: title,
                                                                                    origin,
                                                                                })}
                                                                            </Elements.Text>
                                                                        </Layouts.Col>
                                                                    </Layouts.Col>
                                                                ),
                                                            },
                                                            {
                                                                active: level === 1,
                                                                children: (
                                                                    <Layouts.Col gap={0} align={"center"} style={{ height: "100%" }} fill>
                                                                        <Layouts.Col gap={4} align={"center"} fit>
                                                                            <Elements.Text type={"h3"}>{t("request.state.approved")}</Elements.Text>
                                                                            <Elements.Text weight={"bold"} opacity={0.6}>
                                                                                {t("request.accounts.connect.complete", {
                                                                                    account: accountName,
                                                                                    address: accountAddress,
                                                                                    app: title,
                                                                                    origin,
                                                                                })}
                                                                            </Elements.Text>
                                                                        </Layouts.Col>
                                                                    </Layouts.Col>
                                                                ),
                                                            },
                                                            {
                                                                active: level === 2,
                                                                children: (
                                                                    <Layouts.Col gap={0} align={"center"} style={{ height: "100%" }} fill>
                                                                        <Layouts.Col gap={4} align={"center"} fit>
                                                                            <Elements.Text type={"h3"}>{t("request.state.failure")}</Elements.Text>
                                                                            <Elements.Text weight={"bold"} opacity={0.6}>
                                                                                {error?.message || error}
                                                                            </Elements.Text>
                                                                        </Layouts.Col>
                                                                    </Layouts.Col>
                                                                ),
                                                            },
                                                        ]}
                                                    />
                                                </Layouts.Col>
                                            </Layouts.Contents.InnerContent>
                                            <Layouts.Col gap={4} align={"center"} style={{ padding: "4em", paddingTop: 0 }}>
                                                <Layouts.Contents.SlideContainer
                                                    contents={[
                                                        {
                                                            active: level === 0,
                                                            children: (
                                                                <Layouts.Row gap={2}>
                                                                    <Controls.Button type={"glass"} onClick={handleClose}>
                                                                        {t("app.btn.cancel")}
                                                                    </Controls.Button>
                                                                    <Controls.Button type={"line"} onClick={handleConnect}>
                                                                        {t("request.btn.approve")}
                                                                    </Controls.Button>
                                                                </Layouts.Row>
                                                            ),
                                                        },
                                                        {
                                                            active: level > 0,
                                                            children: (
                                                                <RequestCloseNextActions
                                                                    count={count}
                                                                    onClose={handleClose}
                                                                    onNext={handleNext}
                                                                    closeLabel={t("app.btn.close")}
                                                                    nextLabel={t("request.btn.next")}
                                                                />
                                                            ),
                                                        },
                                                    ]}
                                                />
                                            </Layouts.Col>
                                        </Layouts.Col>
                                    </Layouts.Contents.InnerContent>
                                ),
                            },
                        ]}
                    />
                ) : (
                    <RequestInvalid
                        title={t("request.invalid.title")}
                        message={error?.message || error || t("request.invalid.app.message")}
                        onClose={handleClose}
                        closeLabel={t("app.btn.cancel")}
                    />
                )
            ) : null}
        </AnimatePresence>
    );
}
