"use client";

import Image from "next/image";
import { useMemo } from "react";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { Account, App } from "@coinmeca/wallet-sdk/types";
import { personalSignRequest } from "@coinmeca/wallet-sdk/utils";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { AnimatePresence } from "framer-motion";

import { useRequestAllowance, useRequestApp, useRequestFlow, useTranslate } from "hooks";
import { short } from "utils";
import { RequestCloseNextActions, RequestInvalid } from "../common";

/*
await window.ethereum.providerMap.get("CoinmecaWallet").request({
        method: 'personal_sign',
        params: [
          'Hello, Personal Sign!',
          '0xc8b95755888a2be3f8fa19251f241a1e8b74f933',
        ],
      })
*/

export interface Transaction {
    from: string;
    to: string;
    value: string;
    gas: string;
    gasPrice: string;
    data?: string;
    maxFeePerGas?: number;
    maxPriorityFeePerGas?: number;
}

const method = "personal_sign";
const timeout = 5000;

export default function PersonalSign() {
    const { provider } = useCoinmecaWalletProvider();
    const { t } = useTranslate();
    const { load, request, count, level, setLevel, error, setError, resolve, reject, handleClose, handleNext, scheduleClose, settledRef } = useRequestFlow({
        method,
    });

    const { app, message, signer, address } = useMemo(() => {
        let nextMessage: any;
        let nextAddress: string | undefined;

        let app: App | undefined;
        let signer: Account | undefined;

        if (request) {
            const { params, app: requestApp } = request;
            app = requestApp;

            const current = personalSignRequest(params);
            nextMessage = current?.message;
            nextAddress = current?.address || provider?.address;
            signer = provider?.account(nextAddress || provider?.address);
        }

        return {
            app,
            message: nextMessage,
            signer,
            address: nextAddress,
        };
    }, [provider, request]);
    const { auth, authError } = useRequestAllowance(provider, app, address, !!message);

    const { info, title, origin } = useRequestApp(app, t("reqeust.app.unknown"));
    const signerName = signer?.name || "";
    const signerAddress = short(signer?.address) || "";

    const handleSign = async () => {
        setLevel(1);
        const signRequest = provider?.signMessage(typeof address !== "undefined" ? [message as any, address as any] : [message as any], app);
        if (!signRequest) {
            const cause = "Signing request could not be started.";
            reject(cause);
            setError(cause);
            setLevel(2);
            return;
        }

        await signRequest
            .then((result) => {
                if (settledRef.current) return;
                if (!result) throw new Error("Message signature did not persist.");
                if (!resolve(result)) return;
                setLevel(1);
                scheduleClose(handleClose, timeout);
            })
            .catch((cause) => {
                if (settledRef.current) return;
                reject("Failed to sign.");
                setError(cause);
                setLevel(2);
            });
    };

    return (
        <AnimatePresence>
            {load &&
                (auth && app && message ? (
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
                                                                style: { overflow: "initial" },
                                                                children: (
                                                                    <Layouts.Col gap={8} style={{ flex: 1, height: "100%" }} fill>
                                                                        <Layouts.Col style={level === 0 ? { minHeight: "max-content" } : {}} reverse fill>
                                                                            <Layouts.Box
                                                                                style={{
                                                                                    "--white": "255,255,255",
                                                                                    "--black": "0, 0, 0",
                                                                                    background: "rgba(var(--white),.15)",
                                                                                    maxHeight: "max-content",
                                                                                    padding: "clamp(2em, 7.5%, 4em)",
                                                                                    width: "auto",
                                                                                    height: "auto",
                                                                                }}
                                                                                fit>
                                                                                <Layouts.Col gap={2} align={"left"}>
                                                                                    <Layouts.Col gap={0.5}>
                                                                                        <Elements.Text type={"desc"} weight={"bold"} opacity={0.6}>
                                                                                            {t("request.label.message")}
                                                                                        </Elements.Text>
                                                                                        <Elements.Text>{message}</Elements.Text>
                                                                                    </Layouts.Col>
                                                                                </Layouts.Col>
                                                                            </Layouts.Box>
                                                                        </Layouts.Col>
                                                                    </Layouts.Col>
                                                                ),
                                                            },
                                                            {
                                                                active: level === 1,
                                                                children: (
                                                                    <Layouts.Col gap={0} align={"center"} style={{ height: "100%" }} fill>
                                                                        <Layouts.Col gap={4} align={"center"} fit>
                                                                            <Elements.Text type={"h3"}>{t("request.state.complete")}</Elements.Text>
                                                                            <Elements.Text weight={"bold"} opacity={0.6}>
                                                                                {t("request.sign.personal.complete", {
                                                                                    account: signerName,
                                                                                    address: signerAddress,
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
                                                                    <Controls.Button type={"line"} onClick={handleSign}>
                                                                        {t("request.btn.sign")}
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
                        message={authError?.message || authError || error?.message || error || t("request.invalid.app.message")}
                        onClose={handleClose}
                        closeLabel={t("app.btn.close")}
                    />
                ))}
        </AnimatePresence>
    );
}
