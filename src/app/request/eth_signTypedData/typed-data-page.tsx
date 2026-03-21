"use client";

import Image from "next/image";
import { useMemo } from "react";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { format } from "@coinmeca/ui/lib/utils";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { typedDataRequest } from "@coinmeca/wallet-sdk/utils";
import { Account, App } from "@coinmeca/wallet-sdk/types";
import { AnimatePresence } from "framer-motion";

import { useRequestAllowance, useRequestApp, useRequestFlow, useTranslate } from "hooks";
import { camelToTitleCase, short, valid } from "utils";
import { RequestCloseNextActions, RequestInvalid } from "../common";

const timeout = 5000;

interface TypedDataPageProps {
    method?: string;
    sign?: (provider: any, data: any, signer?: string, app?: App) => Promise<any>;
}

export function TypedDataPage({ method = "eth_signTypedData", sign }: TypedDataPageProps) {
    const { provider } = useCoinmecaWalletProvider();
    const { t } = useTranslate();
    const { load, request, count, level, setLevel, error, setError, resolve, reject, handleClose, handleNext, settledRef } = useRequestFlow({
        method,
    });

    const { app, data, signer, address } = useMemo(() => {
        let data: any;
        let address: string | undefined;

        let app: App | undefined;
        let signer: Account | undefined;

        if (request) {
            const { params, app: _app } = request;
            app = _app;

            const current = typedDataRequest(params);
            data = current?.data;
            address = current?.address || provider?.address;
            signer = provider?.account(address || provider?.address);
        }

        return {
            app,
            data,
            signer,
            address,
        };
    }, [provider, request]);
    const { auth, authError } = useRequestAllowance(provider, app, address, !!data);

    const { info, title, origin } = useRequestApp(app, t("reqeust.app.unknown"));
    const signerName = signer?.name || "";
    const signerAddress = short(signer?.address) || "";

    const handleSign = async () => {
        setLevel(1);
        const signRequest = sign ? sign(provider, data, address, app) : provider?.signTypedData(data, address, app);
        if (!signRequest) {
            const error = "Signing request could not be started.";
            reject(error);
            setError(error);
            setLevel(2);
            return;
        }
        await signRequest
            .then((result) => {
                if (settledRef.current) return;
                if (!result) throw new Error("Typed data signature did not persist.");
                if (!resolve(result)) return;
                setLevel(1);
                // if (count <= 1) timeoutRef.current = setTimeout(handleClose, timeout);
            })
            .catch((error) => {
                if (settledRef.current) return;
                reject("Failed to sign.");
                setError(error);
                setLevel(2);
            });
    };

    const DisplayTypedData = ({ typedData }: any) => {
        const renderValue = (value: any, type: any) => {
            // Parse value based on type
            if (type === "number") {
                return (
                    <Elements.Text align={"right"} fix>
                        {format(value, "number", {
                            unit: 9,
                            limit: 12,
                            fix: 9,
                        })}
                    </Elements.Text>
                );
            }
            if (type === "string") {
                return (
                    <Elements.Text align={"right"} fix>
                        {value?.startsWith("0x") && value?.length >= 20 ? short(value) : value}
                    </Elements.Text>
                );
            }
            if (type === "address") {
                return (
                    <Elements.Text align={"right"} fix>
                        {valid.address(value) ? short(value) : value}
                    </Elements.Text>
                );
            }
            if (type?.startsWith("int") || type?.startsWith("uint")) {
                return (
                    <Elements.Text align={"right"} fix>
                        {format(value, "number", {
                            unit: 9,
                            limit: 12,
                            fix: 9,
                        })}
                    </Elements.Text>
                );
            }
            return Object.entries(value).map(([key, value]) => (
                <Layouts.Row key={key} style={{ flexBasis: "100%" }}>
                    <Elements.Text opacity={0.6} fit>
                        {camelToTitleCase(key)}
                    </Elements.Text>
                    <Layouts.Row key={key}>
                        {Array.isArray(value) ? value.map((item) => renderType(item.name, item.value)) : renderValue(value, typeof value)}
                    </Layouts.Row>
                </Layouts.Row>
            ));
        };

        const renderType = (type: any, value: any) => {
            return (
                <div key={type}>
                    <strong>{type}</strong>: {renderValue(value, type)}
                </div>
            );
        };

        return (
            <Layouts.Col gap={1}>
                <Layouts.Box
                    style={{
                        "--white": "255,255,255",
                        "--black": "0, 0, 0",
                        background: "rgba(var(--black),.3)",
                        maxHeight: "max-content",
                        padding: "clamp(2em, 7.5%, 4em)",
                        width: "auto",
                        height: "auto",
                    }}
                    fit>
                    <Layouts.Col gap={2}>
                        <Elements.Text type={"desc"}>{t("request.label.domain")}</Elements.Text>
                        <Layouts.Col gap={2}>
                            {Object.entries(typedData.domain).map(([key, value]) =>
                                Array.isArray(value) || typeof value === "object" ? (
                                    <Layouts.Col key={key} gap={1}>
                                        <Elements.Text opacity={0.6} case={"capital"} fit>
                                            {camelToTitleCase(key)}
                                        </Elements.Text>
                                        <Layouts.Row
                                            gap={1}
                                            align={"right"}
                                            style={!Array.isArray(value) && typeof value !== "object" ? { minWidth: "max-content" } : {}}
                                            fix={!Array.isArray(value) && typeof value !== "object"}>
                                            {Array.isArray(value) ? value.map((item) => renderType(item.name, item.value)) : renderValue(value, typeof value)}
                                        </Layouts.Row>
                                    </Layouts.Col>
                                ) : (
                                    <Layouts.Row key={key} gap={1}>
                                        <Elements.Text opacity={0.6} case={"capital"} fit>
                                            {camelToTitleCase(key)}
                                        </Elements.Text>
                                        <Layouts.Row
                                            gap={1}
                                            align={"right"}
                                            style={!Array.isArray(value) && typeof value !== "object" ? { minWidth: "max-content" } : {}}
                                            fix={!Array.isArray(value) && typeof value !== "object"}>
                                            {Array.isArray(value) ? value.map((item) => renderType(item.name, item.value)) : renderValue(value, typeof value)}
                                        </Layouts.Row>
                                    </Layouts.Row>
                                ),
                            )}
                        </Layouts.Col>
                    </Layouts.Col>
                </Layouts.Box>
                <Layouts.Box
                    style={{
                        "--white": "255,255,255",
                        "--black": "0, 0, 0",
                        background: "rgba(var(--black),.3)",
                        maxHeight: "max-content",
                        padding: "clamp(2em, 7.5%, 4em)",
                        width: "auto",
                        height: "auto",
                    }}
                    fit>
                    <Layouts.Col gap={2}>
                        <Elements.Text type={"desc"}>{t("request.label.message")}</Elements.Text>
                        {Object.entries(typedData.message).map(([key, value]) =>
                            key === "contents" || Array.isArray(value) || typeof value === "object" ? (
                                <Layouts.Col key={key} gap={2}>
                                    <Elements.Text type={key === "contents" ? "desc" : undefined} opacity={1} fit>
                                        {camelToTitleCase(key)}
                                    </Elements.Text>
                                    <Layouts.Row
                                        gap={1}
                                        align={key === "contents" ? "left" : "right"}
                                        style={!Array.isArray(value) && typeof value !== "object" ? { minWidth: "max-content" } : {}}
                                        fix={!Array.isArray(value) && typeof value !== "object"}>
                                        {Array.isArray(value) ? value.map((item) => renderType(item.name, item.value)) : renderValue(value, typeof value)}
                                    </Layouts.Row>
                                </Layouts.Col>
                            ) : (
                                <Layouts.Row key={key} gap={2}>
                                    <Elements.Text opacity={0.6} fit>
                                        {camelToTitleCase(key)}
                                    </Elements.Text>
                                    <Layouts.Row
                                        gap={1}
                                        align={"right"}
                                        style={{ minWidth: "max-content" }}
                                        fix={!Array.isArray(value) && typeof value !== "object"}>
                                        {Array.isArray(value) ? value.map((item) => renderType(item.name, item.value)) : renderValue(value, typeof value)}
                                    </Layouts.Row>
                                </Layouts.Row>
                            ),
                        )}
                    </Layouts.Col>
                </Layouts.Box>
            </Layouts.Col>
        );
    };

    return (
        <AnimatePresence>
            {load &&
                (auth && app && typeof data === "object" && !!data ? (
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
                                                    {/* <Layouts.Col gap={8} align={"center"} style={{ flex: 1 }} fill> */}
                                                    <Layouts.Contents.SlideContainer
                                                        style={{ flex: 1 }}
                                                        contents={[
                                                            {
                                                                active: level === 0,
                                                                style: { overflow: "initial" },
                                                                children: (
                                                                    <Layouts.Col gap={8} style={{ flex: 1, height: "100%" }} fill>
                                                                        <Layouts.Col style={level === 0 ? { minHeight: "max-content" } : {}} reverse fill>
                                                                            <DisplayTypedData typedData={data} />
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
                                                                                {t("request.sign.typed.complete", {
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
                                                    {/* </Layouts.Col> */}
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

