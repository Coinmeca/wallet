"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { parseChainId } from "@coinmeca/wallet-provider/chains";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { valid } from "@coinmeca/wallet-sdk/utils";
import { AnimatePresence } from "framer-motion";

import { useRequestChain, useRequestFlow, useTranslate } from "hooks";
import { chainLogo } from "utils";
import { RequestCloseNextActions, RequestInvalid } from "../common";

/*
await window.ethereum.providerMap.get("CoinmecaWallet").request({method:"wallet_addEthereumChain", params:[{chainId: '0x13e31'}]})
*/

const method = "wallet_switchEthereumChain";
const timeout = 5000;

export default function Page() {
    const { provider, chain } = useCoinmecaWalletProvider();
    const { t } = useTranslate();
    const { load, id, request, count, level, setLevel, error, setError, resolve, reject, handleClose, handleNext, scheduleClose, settledRef } = useRequestFlow({
        method,
    });

    const [selectedChain, setSelectedChain] = useState<any>();
    const { activeChain, requestChain: resolvedNewChain } = useRequestChain(provider, request?.params?.chainId);
    const isReady = load && request?.method === method;
    const requestedChainId = useMemo(() => {
        const value = request?.params?.chainId;
        return typeof value !== "undefined" && valid.chainId(value) ? parseChainId(value) : undefined;
    }, [request?.params?.chainId]);
    const newChain = useMemo(
        () => resolvedNewChain || (typeof requestedChainId === "number" ? ({ chainId: requestedChainId } as any) : undefined),
        [requestedChainId, resolvedNewChain],
    );
    const currentChain = selectedChain || chain || activeChain;
    const invalid = isReady && typeof requestedChainId !== "number";
    const selectedChainName = currentChain?.chainName || currentChain?.chainId || "";
    const newChainName = newChain?.chainName || newChain?.chainId || "";

    const handleSwitchChain = async () => {
        const switchRequest = provider?.switchEthereumChain((request?.params as any)?.chainId || resolvedNewChain?.chainId);
        if (!switchRequest) {
            const error = "Chain switch request could not be started.";
            reject(error);
            setError(error);
            setLevel(2);
            return;
        }

        await switchRequest
            .then((result) => {
                if (settledRef.current) return;
                if (!result) throw new Error("Chain switch did not persist.");
                if (!resolve(true)) return;
                setLevel(1);
                scheduleClose(handleClose, timeout);
            })
            .catch((error) => {
                if (settledRef.current) return;
                reject(error?.message || error);
                setError(error);
                setLevel(2);
            });
    };

    useEffect(() => {
        if (!isReady || level > 0) return;
        setSelectedChain(chain || activeChain);
    }, [activeChain, chain, id, isReady, level]);

    return (
        <AnimatePresence>
            {load &&
                isReady &&
                (newChain ? (
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
                                                                <Image
                                                                    src={chainLogo(currentChain?.chainId, currentChain?.logo) || ""}
                                                                    width={0}
                                                                    height={0}
                                                                    alt={currentChain?.chainName || ""}
                                                                    style={{ width: "4em", height: "4em", borderRadius: "100%" }}
                                                                />
                                                            </div>
                                                            <Layouts.Col gap={0} align={"center"} fill>
                                                                <Elements.Text type={"h6"} height={0} align={"left"}>
                                                                    {currentChain?.chainName}
                                                                </Elements.Text>
                                                                <Elements.Text type={"strong"} height={0} align={"left"} opacity={0.6}>
                                                                    {currentChain?.chainId}
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
                                                                <Image
                                                                    src={chainLogo(newChain?.chainId, newChain?.logo) || ""}
                                                                    width={0}
                                                                    height={0}
                                                                    alt={newChain?.chainName || ""}
                                                                    style={{ width: "4em", height: "4em", borderRadius: "100%" }}
                                                                />
                                                            </div>
                                                            <Layouts.Col gap={0} align={"center"}>
                                                                <Elements.Text type={"h6"} height={0} align={"left"}>
                                                                    {newChain?.chainName}
                                                                </Elements.Text>
                                                                <Elements.Text type={"strong"} height={0} align={"left"} opacity={0.6}>
                                                                    {newChain?.chainId}
                                                                </Elements.Text>
                                                            </Layouts.Col>
                                                        </Layouts.Row>
                                                    </Layouts.Col>
                                                </Layouts.Col>
                                                <Layouts.Col gap={8} align={"center"} style={{ flex: 1 }} fill>
                                                    <Layouts.Col gap={4} align={"center"} fit>
                                                        <Elements.Text type={"h3"}>{t("request.state.switch")}</Elements.Text>
                                                        <Elements.Text weight={"bold"} opacity={0.6}>
                                                            {t("request.chain.switch.prompt", {
                                                                from: selectedChainName,
                                                                to: newChainName,
                                                            })}
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
                                                <Controls.Button type={"line"} onClick={handleSwitchChain}>
                                                    {t("request.btn.chain.switch")}
                                                </Controls.Button>
                                            </Layouts.Row>
                                        </Layouts.Col>
                                    </Layouts.Col>
                                ),
                            },
                            {
                                active: level === 1,
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
                                                                    padding: "1em",
                                                                    borderRadius: "100%",
                                                                    background: "rgba(var(--white),.15)",
                                                                }}>
                                                                <Image
                                                                    src={require("../../../assets/animation/success.gif")}
                                                                    width={0}
                                                                    height={0}
                                                                    alt={newChain.chainName || ""}
                                                                    style={{ width: "12em", height: "12em", borderRadius: "100%" }}
                                                                />
                                                            </div>
                                                            <Layouts.Col gap={0} align={"center"}>
                                                                <Elements.Text type={"h6"} height={0}>
                                                                    {newChain?.chainName}
                                                                </Elements.Text>
                                                                <Elements.Text type={"strong"} height={0} opacity={0.6}>
                                                                    {newChain?.chainId}
                                                                </Elements.Text>
                                                            </Layouts.Col>
                                                        </Layouts.Col>
                                                    </Layouts.Col>
                                                    <Layouts.Col gap={8} align={"center"} style={{ flex: 1 }} fill>
                                                        <Layouts.Col align={"center"} style={{ padding: "4em" }}>
                                                            <Layouts.Col gap={4} align={"center"} fit>
                                                                <Elements.Text type={"h3"}>{t("request.state.complete")}</Elements.Text>
                                                                <Elements.Text weight={"bold"} opacity={0.6}>
                                                                    {t("request.chain.switch.complete", {
                                                                        from: selectedChainName,
                                                                        to: newChainName,
                                                                    })}
                                                                </Elements.Text>
                                                            </Layouts.Col>
                                                        </Layouts.Col>
                                                    </Layouts.Col>
                                                </Layouts.Col>
                                            </Layouts.Contents.InnerContent>
                                            <Layouts.Col gap={4} align={"center"} style={{ padding: "4em", paddingTop: 0 }}>
                                                <RequestCloseNextActions
                                                    count={count}
                                                    onClose={handleClose}
                                                    onNext={handleNext}
                                                    closeLabel={t("app.btn.close")}
                                                    nextLabel={t("request.btn.next")}
                                                />
                                            </Layouts.Col>
                                        </Layouts.Col>
                                    </Layouts.Contents.InnerContent>
                                ),
                            },
                            {
                                active: level === 2,
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
                                                                    padding: "1em",
                                                                    borderRadius: "100%",
                                                                    background: "rgba(var(--white),.15)",
                                                                }}>
                                                                <Image
                                                                    src={require("../../../assets/animation/failure.gif")}
                                                                    width={0}
                                                                    height={0}
                                                                    alt={newChain.chainName || ""}
                                                                    style={{ width: "12em", height: "12em", borderRadius: "100%" }}
                                                                />
                                                            </div>
                                                            <Layouts.Col gap={0} align={"center"}>
                                                                <Elements.Text type={"h6"} height={0}>
                                                                    {newChain?.chainName}
                                                                </Elements.Text>
                                                                <Elements.Text type={"strong"} height={0} opacity={0.6}>
                                                                    {newChain?.chainId}
                                                                </Elements.Text>
                                                            </Layouts.Col>
                                                        </Layouts.Col>
                                                    </Layouts.Col>
                                                    <Layouts.Col gap={8} align={"center"} style={{ flex: 1 }} fill>
                                                        <Layouts.Col align={"center"} style={{ padding: "4em" }}>
                                                            <Layouts.Col gap={4} align={"center"} fit>
                                                                <Elements.Text type={"h3"}>{t("request.state.failure")}</Elements.Text>
                                                                <Elements.Text weight={"bold"} opacity={0.6}>
                                                                    {error?.message || error}
                                                                </Elements.Text>
                                                            </Layouts.Col>
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
                ) : invalid ? (
                    <RequestInvalid
                        title={t("request.invalid.title")}
                        message={error?.message || error || t("request.invalid.chain.message")}
                        onClose={handleClose}
                        closeLabel={t("app.btn.close")}
                    />
                ) : null)}
        </AnimatePresence>
    );
}
