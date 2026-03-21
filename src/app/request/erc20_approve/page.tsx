"use client";

import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import { Contents, Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { format } from "@coinmeca/ui/lib/utils";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { Account } from "@coinmeca/wallet-sdk/types";
import { erc20ApproveCall, transactionRequest } from "@coinmeca/wallet-sdk/utils";
import { useQueries } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";

import { useRequestAllowance, useRequestApp, useRequestChain, useRequestFlow, useTranslate } from "hooks";
import { query } from "api/query";
import { GetMaxFeePerGas } from "api/onchain";
import { short, valid } from "utils";
import { RequestCloseNextActions, RequestInvalid } from "../common";

/*
await window.ethereum.providerMap.get("CoinmecaWallet").request({
    method: 'eth_sendTransaction',
    params: [
        {
            "from": "0xc8b95755888a2be3f8fa19251f241a1e8b74f933`,
            "to": "0xYourTokenContractAddress",
            "data": "0x095ea7b30000000000000000000000000x1234567890123456789012345678901234567890000000000000000000000000000000001b69b4e3eb3e4c0b1b7f89d8f"
        },
    ],
})
*/

const method = "erc20_approve";
const timeout = 5000;

const decimalAmount = (value: bigint, decimals: number) => {
    const negative = value < 0n;
    const digits = `${negative ? -value : value}`;

    if (!Number.isInteger(decimals) || decimals <= 0) return `${negative ? "-" : ""}${digits}`;

    const padded = digits.padStart(decimals + 1, "0");
    const whole = padded.slice(0, -decimals);
    const fraction = padded.slice(-decimals).replace(/0+$/, "");

    return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
};

export default function Page() {
    const { provider } = useCoinmecaWalletProvider();
    const { t } = useTranslate();

    const [txHash, setTxHash] = useState<string>("");
    const resetState = useCallback(() => setTxHash(""), []);
    const { load, request, count, level, setLevel, error, setError, resolve, reject, handleClose, handleNext, scheduleClose, settledRef } = useRequestFlow({
        method,
        onReset: resetState,
    });

    const { app, params, tx, signer } = useMemo(() => {
        let tx: any;
        let signer: Account | undefined;

        const { params, app } = request;

        tx = transactionRequest(params);
        const address = tx?.from || provider?.address;
        signer = provider?.account(address);

        return {
            app,
            params,
            tx,
            signer,
        };
    }, [provider, request]);
    const approval = useMemo(() => erc20ApproveCall(tx?.data), [tx?.data]);
    const token = useMemo(() => (typeof tx?.to === "string" && valid.address(tx.to) ? tx.to : undefined), [tx?.to]);
    const signerAddress = tx?.from || provider?.address;
    const { auth, authError } = useRequestAllowance(provider, app, signerAddress, !!tx && !!approval && !!token);
    const spender = approval?.spender || "";
    const amount = approval?.amount;
    const { activeChain, requestedChainId, requestChain } = useRequestChain(provider, tx?.chainId);

    const [{ data: nonce }, { data: gasPrice, isLoading: isGasPriceLoading }, { data: estimateGas, isLoading: isEstimateGasLoading }, { data: decimals }] =
        useQueries({
            queries: [
                query.onchain.nonce(requestChain?.rpcUrls?.[0], signer?.address),
                query.onchain.gasPrice(requestChain?.rpcUrls?.[0]),
                query.onchain.estimateGas(requestChain?.rpcUrls?.[0], tx),
                query.erc20.decimals(requestChain?.rpcUrls?.[0], token),
            ],
        });
    const amountDisplay = useMemo(() => {
        if (typeof amount !== "bigint") return "0 (no decimals)";
        if (typeof decimals !== "number" || !Number.isInteger(decimals) || decimals < 0) return `${amount.toString()} (no decimals)`;
        return format(decimalAmount(amount, decimals), "currency", {
            unit: 9,
            limit: 12,
            fix: 9,
        });
    }, [amount, decimals]);
    const {
        data: { maxPriorityFeePerGas, maxFeePerGas },
    } = GetMaxFeePerGas(requestChain?.rpcUrls?.[0]);

    const handleSign = async () => {
        setLevel(1);
        const sendRequest = provider?.send(
            {
                to: tx?.to,
                data: tx?.data,
                value: BigInt(tx?.value || 0),
                nonce: BigInt(nonce || 0),
                gasLimit: BigInt(estimateGas?.raw || 0),
                gasPrice: BigInt(gasPrice?.raw || 0),
                ...(typeof requestedChainId === "number" ? { chainId: requestedChainId } : {}),
                maxFeePerGas: BigInt(maxFeePerGas?.raw || 0),
                maxPriorityFeePerGas: BigInt(maxPriorityFeePerGas?.raw || 0),
            } as any,
            signerAddress as any,
            app,
        );
        if (!sendRequest) {
            const error = "Transaction request could not be started.";
            reject(error);
            setError(error);
            setLevel(3);
            return;
        }

        await sendRequest
            .then((result) => {
                if (settledRef.current) return;
                if (!result) throw new Error("Transaction Submit Failed.");
                if (!resolve(result)) return;
                setTxHash(result);
                setLevel(2);
                scheduleClose(handleClose, timeout);
            })
            .catch((error) => {
                if (settledRef.current) return;
                reject(error?.message || error);
                setError(error);
                setLevel(3);
            });
    };

    const { info, title, origin } = useRequestApp(app, t("reqeust.app.unknown"));
    const txHashShort = short(txHash) || "";
    const txToShort = short(token) || "";
    const signerLabel = typeof signer?.index === "number" ? `${signer.index + 1}` : "?";

    return (
        <AnimatePresence>
            {load &&
                (auth && app && tx && approval && token ? (
                    <Layouts.Contents.SlideContainer
                        contents={[
                            {
                                active: level === 0,
                                children: (
                                    <Layouts.Col gap={2} align={"center"} fill>
                                        <Layouts.Contents.InnerContent padding={[4, 4, 0]}>
                                            <Layouts.Col fill>
                                                <Layouts.Col align={"center"} style={{ flex: 1 }}>
                                                    <Layouts.Col gap={6} fit>
                                                        <Layouts.Row gap={3} align={"center"} fix>
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
                                                                <div style={{ position: "relative", width: "4em", height: "4em" }}>
                                                                    <Image
                                                                        src={app?.logo || ""}
                                                                        width={0}
                                                                        height={0}
                                                                        title={title}
                                                                        alt={title}
                                                                        style={{ width: "100%", height: "100%", borderRadius: "100%" }}
                                                                    />
                                                                    <Image
                                                                        src={requestChain?.logo || activeChain?.logo || ""}
                                                                        width={0}
                                                                        height={0}
                                                                        title={requestChain?.chainName || activeChain?.chainName || ""}
                                                                        alt={requestChain?.chainName || activeChain?.chainName || ""}
                                                                        style={{
                                                                            position: "absolute",
                                                                            width: "2em",
                                                                            height: "2em",
                                                                            right: "-0.5em",
                                                                            bottom: "-0.5em",
                                                                            borderRadius: "100%",
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <Layouts.Col gap={0} align={"center"} fill>
                                                                <Elements.Text type={"desc"} weight={"bold"} height={0} align={"left"} opacity={0.6}>
                                                                    {t("request.label.requested.by")}
                                                                </Elements.Text>
                                                                <Layouts.Col gap={0}>
                                                                    <Elements.Text type={"h6"} height={0} align={"left"}>
                                                                        {title}
                                                                    </Elements.Text>
                                                                    <Elements.Text type={"strong"} height={0} align={"left"} opacity={0.6}>
                                                                        {info?.origin || app?.url}
                                                                    </Elements.Text>
                                                                </Layouts.Col>
                                                            </Layouts.Col>
                                                        </Layouts.Row>
                                                        <Layouts.Divider />
                                                        <Layouts.Row gap={3} align={"center"} fix>
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
                                                                <Elements.Avatar character={signerLabel} name={signerLabel} title={signer?.name} hideName />
                                                            </div>
                                                            <Layouts.Col gap={0} align={"center"}>
                                                                <Elements.Text type={"h6"} height={0} align={"left"}>
                                                                    {signer?.name}
                                                                </Elements.Text>
                                                                <Elements.Text type={"strong"} height={0} align={"left"} opacity={0.6}>
                                                                    {short(signer?.address)}
                                                                </Elements.Text>
                                                            </Layouts.Col>
                                                        </Layouts.Row>
                                                        <Layouts.Divider>
                                                            <Elements.Icon icon={"chevron-down"} />
                                                        </Layouts.Divider>
                                                        <Layouts.Row gap={3} align={"center"} fix>
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
                                                                <Elements.Avatar
                                                                    character={short(tx?.to?.startsWith("0x") ? tx?.to?.substring(2, tx?.to?.length) : tx?.to, {
                                                                        length: 2,
                                                                        front: true,
                                                                    })}
                                                                    name={"To"}
                                                                    hideName
                                                                />
                                                            </div>
                                                            <Layouts.Col gap={0} align={"center"}>
                                                                <Elements.Text type={"h6"} height={0} align={"left"}>
                                                                    {t("request.label.to")}
                                                                </Elements.Text>
                                                                <Elements.Text type={"strong"} height={0} align={"left"} opacity={0.6}>
                                                                    {short(tx?.to)}
                                                                </Elements.Text>
                                                            </Layouts.Col>
                                                        </Layouts.Row>
                                                    </Layouts.Col>
                                                </Layouts.Col>
                                                <Layouts.Col gap={8} style={{ flex: 1 }} fill>
                                                    <Layouts.Col reverse fill>
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
                                                                        {t("request.label.amount")}
                                                                    </Elements.Text>
                                                                    <Elements.Text>{amountDisplay}</Elements.Text>
                                                                </Layouts.Col>
                                                                <Layouts.Col gap={0}>
                                                                    <Elements.Text type={"desc"} weight={"bold"} opacity={0.6}>
                                                                        {t("request.label.spender")}
                                                                    </Elements.Text>
                                                                    <Layouts.Row gap={1} align={"center"} fix>
                                                                        <Elements.Text align={"left"} title={spender}>
                                                                            {short(spender)}
                                                                        </Elements.Text>
                                                                        <Controls.Button icon={"copy"} fit />
                                                                    </Layouts.Row>
                                                                </Layouts.Col>
                                                                <Layouts.Col gap={0.5}>
                                                                    <Elements.Text type={"desc"} weight={"bold"} opacity={0.6}>
                                                                        {t("request.label.estimated.gas")}
                                                                    </Elements.Text>
                                                                    <Elements.Text>
                                                                        {isEstimateGasLoading
                                                                            ? "~"
                                                                            : format(estimateGas?.format, "currency", {
                                                                                  unit: 9,
                                                                                  limit: 12,
                                                                                  fix: 9,
                                                                              })}
                                                                    </Elements.Text>
                                                                </Layouts.Col>
                                                                <Layouts.Col gap={0.5}>
                                                                    <Elements.Text type={"desc"} weight={"bold"} opacity={0.6}>
                                                                        {t("request.label.total")}
                                                                    </Elements.Text>
                                                                    <Layouts.Row gap={1} fix>
                                                                        <Elements.Text style={{ flex: "initial" }} fix>
                                                                            {isGasPriceLoading || isEstimateGasLoading
                                                                                ? "~"
                                                                                : format((gasPrice?.format || 0) * (estimateGas?.format || 0), "currency", {
                                                                                      unit: 9,
                                                                                      limit: 12,
                                                                                      fix: 9,
                                                                                  })}
                                                                        </Elements.Text>
                                                                        <Elements.Text opacity={0.6} fit>
                                                                            {requestChain?.nativeCurrency?.symbol || activeChain?.nativeCurrency?.symbol}
                                                                        </Elements.Text>
                                                                    </Layouts.Row>
                                                                </Layouts.Col>
                                                            </Layouts.Col>
                                                        </Layouts.Box>
                                                    </Layouts.Col>
                                                </Layouts.Col>
                                            </Layouts.Col>
                                        </Layouts.Contents.InnerContent>
                                        <Layouts.Col gap={4} align={"center"} style={{ padding: "4em", paddingTop: 0 }}>
                                            <Layouts.Row gap={2}>
                                                <Controls.Button type={"glass"} onClick={handleClose}>
                                                    {t("app.btn.close")}
                                                </Controls.Button>
                                                <Controls.Button type={"line"} onClick={handleSign}>
                                                    {t("request.btn.approve")}
                                                </Controls.Button>
                                            </Layouts.Row>
                                        </Layouts.Col>
                                    </Layouts.Col>
                                ),
                            },
                            {
                                active: level === 1,
                                children: <Contents.States.Loading />,
                            },
                            {
                                active: level === 2,
                                children: (
                                    <Layouts.Contents.InnerContent scroll={false}>
                                        <Layouts.Col align={"center"} style={{ padding: "4em" }} fill>
                                            <Layouts.Col align={"center"} style={{ flex: 1 }}>
                                                <Layouts.Col fit>
                                                    <Layouts.Col gap={8} align={"center"} fit>
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                maxWidth: "max-content",
                                                                maxHeight: "max-content",
                                                                padding: "1em",
                                                                borderRadius: "100%",
                                                                background: "rgba(var(--white),.15)",
                                                            }}>
                                                            <Image
                                                                src={require("../../../assets/animation/success.gif")}
                                                                width={0}
                                                                height={0}
                                                                alt={title}
                                                                style={{ width: "12em", height: "12em" }}
                                                            />
                                                        </div>
                                                        <Layouts.Col gap={0} align={"center"}>
                                                            <Elements.Text type={"h6"} height={0}>
                                                                {title}
                                                            </Elements.Text>
                                                            <Elements.Text type={"strong"} height={0} opacity={0.6}>
                                                                {tx?.to}
                                                            </Elements.Text>
                                                        </Layouts.Col>
                                                    </Layouts.Col>
                                                </Layouts.Col>
                                            </Layouts.Col>
                                            <Layouts.Col gap={0} align={"center"} style={{ flex: 1 }} fill>
                                                <Layouts.Col align={"center"} style={{ padding: "4em" }}>
                                                    <Layouts.Col gap={4} align={"center"} fit>
                                                        <Elements.Text type={"h3"}>{t("request.state.complete")}</Elements.Text>
                                                        <Elements.Text weight={"bold"} opacity={0.6}>
                                                            {t("request.transaction.send.complete", {
                                                                hash: txHashShort,
                                                                to: txToShort,
                                                                origin,
                                                            })}
                                                        </Elements.Text>
                                                    </Layouts.Col>
                                                </Layouts.Col>
                                                <Layouts.Col gap={4} align={"center"} style={{ margin: 0 }} fit>
                                                    <RequestCloseNextActions
                                                        count={count}
                                                        onClose={handleClose}
                                                        onNext={handleNext}
                                                        closeLabel={t("app.btn.close")}
                                                        nextLabel={t("request.btn.next")}
                                                    />
                                                </Layouts.Col>
                                            </Layouts.Col>
                                        </Layouts.Col>
                                    </Layouts.Contents.InnerContent>
                                ),
                            },
                            {
                                active: level === 3,
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
                                                                    src={require("../../../assets/animation/failure.gif")}
                                                                    alt={"Failure"}
                                                                    style={{ width: "8em", height: "8em" }}
                                                                />
                                                            </div>
                                                        </Layouts.Col>
                                                    </Layouts.Col>
                                                    <Layouts.Col gap={8} align={"center"} style={{ flex: 1 }} fill>
                                                        <Layouts.Col gap={4} align={"center"} fit>
                                                            <Elements.Text type={"h3"}>{t("request.state.failure")}</Elements.Text>
                                                            <Elements.Text weight={"bold"} opacity={0.6}>
                                                                {error?.message || error}
                                                            </Elements.Text>
                                                        </Layouts.Col>
                                                    </Layouts.Col>
                                                </Layouts.Col>
                                            </Layouts.Contents.InnerContent>
                                            <Layouts.Col gap={4} align={"center"} style={{ padding: "4em", paddingTop: 0 }}>
                                                <Layouts.Row gap={2}>
                                                    <Controls.Button type={"glass"} onClick={handleClose}>
                                                        {t("app.btn.close")}
                                                    </Controls.Button>
                                                </Layouts.Row>
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
                        message={authError?.message || authError || error?.message || error || t("request.invalid.transaction.message")}
                        onClose={handleClose}
                        closeLabel={t("app.btn.close")}
                    />
                ))}
        </AnimatePresence>
    );
}
