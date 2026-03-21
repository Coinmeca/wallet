"use client";

import Image from "next/image";
import { useMemo } from "react";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { AnimatePresence } from "framer-motion";

import { useRequestChain, useRequestFlow, useTranslate } from "hooks";
import { GetErc20 } from "api/erc20";
import { short, tokenLogo, valid } from "utils";
import { RequestCloseNextActions, RequestInvalid } from "../common";

/*
await adapter?.request({
                method,
                params: {
                    type: "ERC20",
                    options: {
                        address: "0xb60e8dd61c5d32be8058bb8eb970870f07233155",
                        symbol: "FOO",
                        decimals: 18,
                        image: "https://foo.io/token-image.svg",
                    },
                },
            })
*/

const method = "wallet_watchAsset";
const timeout = 5000;

export default function Page() {
    const { provider } = useCoinmecaWalletProvider();
    const { t } = useTranslate();
    const { load, request, count, level, setLevel, error, setError, resolve, reject, handleClose, handleNext, scheduleClose, settledRef } = useRequestFlow({
        method,
    });

    const { params } = request;
    const requestedAddress = useMemo(() => {
        const next = params?.options?.address;
        return typeof next === "string" && valid.address(next) ? next : undefined;
    }, [params?.options?.address]);
    const activeAddress = provider?.address;
    const activeAccount = provider?.account(activeAddress);
    const { activeChain } = useRequestChain(provider);
    const [result] = GetErc20(activeChain?.rpcUrls?.[0], requestedAddress, activeAddress);
    const asset = requestedAddress ? result?.[requestedAddress] : undefined;
    const validRequest = params?.type === "ERC20" && !!requestedAddress;
    const requestSymbol = typeof params?.options?.symbol === "string" ? params.options.symbol.trim() : "";
    const requestName = typeof params?.options?.name === "string" ? params.options.name.trim() : "";
    const requestImage = typeof params?.options?.image === "string" ? params.options.image.trim() : "";
    const assetSymbol = asset?.data?.symbol || requestSymbol || "";
    const assetName = asset?.data?.name || requestName || "";
    const assetAddress = short(requestedAddress) || "";
    const accountName = activeAccount?.name || "";
    const accountAddress = short(activeAddress) || "";

    const handleAddAsset = async () => {
        try {
            if (provider?.watchAsset(request?.params, activeAddress)) {
                if (!resolve(true)) return;
                setLevel(1);
                scheduleClose(handleClose, timeout);
                return;
            }

            const error = "Asset data is invalid.";
            reject(error);
            setError(error);
        } catch (error: any) {
            reject(error?.message || error);
            setError(error?.message || error);
        }
    };

    return (
        <AnimatePresence>
            {load &&
                (validRequest ? (
                    <Layouts.Contents.SlideContainer
                        contents={[
                            {
                                active: true,
                                children: (
                                    <Layouts.Contents.InnerContent scroll={false}>
                                        <Layouts.Col gap={2} align={"center"} fill>
                                            {/* Content omitted for brevity */}
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
                                                                        level === 0 && !error
                                                                            ? requestImage || tokenLogo(activeChain?.chainId, requestedAddress)
                                                                            : require(`../../../assets/animation/${level === 1 ? "success" : "failure"}.gif`)
                                                                    }
                                                                    alt={assetSymbol || "Unknown"}
                                                                    style={{ width: "8em", height: "8em" }}
                                                                />
                                                            </div>
                                                            <Layouts.Col gap={1}>
                                                                <Elements.Text type={"h4"}>{assetSymbol}</Elements.Text>
                                                                <Elements.Text type={"h6"}>{assetName}</Elements.Text>
                                                                <Elements.Text type={"strong"} opacity={0.6}>
                                                                    {assetAddress}
                                                                </Elements.Text>
                                                            </Layouts.Col>
                                                        </Layouts.Col>
                                                    </Layouts.Col>
                                                    <Layouts.Contents.SlideContainer
                                                        style={{ flex: 1 }}
                                                        contents={[
                                                            {
                                                                active: level === 0 && !error,
                                                                children: (
                                                                    <Layouts.Col gap={0} align={"center"} style={{ height: "100%" }} fill>
                                                                        <Layouts.Col gap={4} align={"center"} fit>
                                                                            <Elements.Text type={"h3"}>
                                                                                {t("request.asset.watch.title", { symbol: assetSymbol })}
                                                                            </Elements.Text>
                                                                            <Elements.Text weight={"bold"} opacity={0.6}>
                                                                                {t("request.asset.watch.prompt", {
                                                                                    symbol: assetSymbol,
                                                                                    address: assetAddress,
                                                                                    account: accountName,
                                                                                    accountAddress,
                                                                                })}
                                                                            </Elements.Text>
                                                                        </Layouts.Col>
                                                                    </Layouts.Col>
                                                                ),
                                                            },
                                                            {
                                                                active: level === 0 && !!error,
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
                                                            {
                                                                active: level === 1,
                                                                children: (
                                                                    <Layouts.Col gap={0} align={"center"} style={{ height: "100%" }} fill>
                                                                        <Layouts.Col gap={4} align={"center"} fit>
                                                                            <Elements.Text type={"h3"}>{t("request.state.complete")}</Elements.Text>
                                                                            <Elements.Text weight={"bold"} opacity={0.6}>
                                                                                {t("request.asset.watch.complete", {
                                                                                    symbol: assetSymbol,
                                                                                    address: assetAddress,
                                                                                })}
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
                                                            active: level === 0 && !error,
                                                            children: (
                                                                <Layouts.Row gap={2}>
                                                                    <Controls.Button type={"glass"} onClick={handleClose}>
                                                                        {t("app.btn.cancel")}
                                                                    </Controls.Button>
                                                                    <Controls.Button type={"line"} onClick={handleAddAsset}>
                                                                        {t("request.btn.asset.add")}
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
                        closeLabel={t("app.btn.close")}
                    />
                ))}
        </AnimatePresence>
    );
}
