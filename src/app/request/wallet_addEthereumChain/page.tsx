"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { parseChainId } from "@coinmeca/wallet-provider/chains";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { Chain } from "@coinmeca/wallet-sdk/types";
import { chainUrl, chainUrls, valid } from "@coinmeca/wallet-sdk/utils";
import { AnimatePresence, motion } from "framer-motion";

import { useRequestChain, useRequestFlow, useTranslate } from "hooks";
import { chainLogo } from "utils";
import { RequestCloseNextActions, RequestInvalid } from "../common";
/*
await window.ethereum.providerMap.get("CoinmecaWallet").request({method:"wallet_addEthereumChain", params:[{
            chainId: '0x13e31',
            chainName: "Blast",
            rpcUrls: [
                "https://rpc.blast.io",
                "https://rpc.ankr.com/blast",
                "https://blast.din.dev/rpc",
                "https://blastl2-mainnet.public.blastapi.io",
                "https://blast.blockpi.network/v1/rpc/public",
                "https://blast.gasswap.org",
                "wss://blast.gasswap.org",
            ],
            blockExplorerUrls: ["https://blastscan.io"],
            nativeCurrency: {
                name: "Ethereum",
                symbol: "ETH",
                decimals: 18,
            }
        }]})
*/

const method = "wallet_addEthereumChain";
const timeout = 5000;

export default function Page() {
    const { provider, chain } = useCoinmecaWalletProvider();
    const { t } = useTranslate();
    const { load, id, setId, request, next, count, level, setLevel, error, setError, resolve, reject, closeRequest, scheduleClose, settledRef } =
        useRequestFlow({
            method,
        });

    const [selectedChain, setSelectedChain] = useState<any>();
    const { activeChain } = useRequestChain(provider);
    const isReady = load && !!id && request?.method === method;
    const requestParams = request?.params;
    const newChain = useMemo(() => {
        if (!requestParams || typeof requestParams !== "object" || Array.isArray(requestParams)) return undefined;
        const params = requestParams;
        const { chainId, chainName, rpcUrls, nativeCurrency, blockExplorerUrls, iconUrls, logo } = params || {};
        const parsedChainId = valid.chainId(chainId) ? parseChainId(chainId) : undefined;
        const nextRpcUrls = Array.isArray(rpcUrls) ? chainUrls(rpcUrls, "rpc") || rpcUrls : rpcUrls;
        const nextBlockExplorerUrls = Array.isArray(blockExplorerUrls) ? chainUrls(blockExplorerUrls, "explorer") || blockExplorerUrls : blockExplorerUrls;
        const nextIconUrls = Array.isArray(iconUrls) ? chainUrls(iconUrls, "icon") || iconUrls : iconUrls;
        const nextLogo = chainUrl(logo, "icon") || logo;
        return {
            ...params,
            ...(typeof parsedChainId === "number" ? { chainId: parsedChainId } : {}),
            ...(typeof chainName === "string" ? { chainName } : {}),
            ...(nativeCurrency && typeof nativeCurrency === "object" ? { nativeCurrency } : {}),
            ...(typeof nextRpcUrls !== "undefined" ? { rpcUrls: nextRpcUrls } : {}),
            ...(typeof nextBlockExplorerUrls !== "undefined" ? { blockExplorerUrls: nextBlockExplorerUrls } : {}),
            ...(typeof nextIconUrls !== "undefined" ? { iconUrls: nextIconUrls } : {}),
            ...(typeof nextLogo !== "undefined" ? { logo: nextLogo } : {}),
        } as Chain;
    }, [requestParams]);
    const currentChain = selectedChain || chain || activeChain;
    const invalid = isReady && (!requestParams || typeof requestParams !== "object" || Array.isArray(requestParams));
    const selectedChainName = currentChain?.chainName || currentChain?.chainId || "";
    const newChainName = newChain?.chainName || "";

    const result = () => {
        if (level === 0) reject("User rejected the request");
        else if (level === 1) resolve(true);
    };

    const handleClose = () => {
        result();
        closeRequest();
    };

    const handleNext = () => {
        result();
        setId(next(id) || "");
    };

    const handleAddChain = async () => {
        const addRequest = provider?.addEthereumChain((requestParams || newChain) as any);
        if (!addRequest) {
            const error = "Chain registration request could not be started.";
            reject(error);
            setError(error);
            setLevel(3);
            return;
        }

        await addRequest
            .then((result) => {
                if (settledRef.current) return;
                if (!result) throw new Error("Chain registration did not persist.");
                setLevel(1);
            })
            .catch((error) => {
                if (settledRef.current) return;
                reject(error?.message || error);
                setError(error);
                setLevel(3);
            });
    };

    const handleSwitchChain = async () => {
        const switchRequest = provider?.switchEthereumChain((requestParams as any)?.chainId || newChain?.chainId);
        if (!switchRequest) {
            const error = "Chain switch request could not be started.";
            reject(error);
            setError(error);
            setLevel(3);
            return;
        }

        await switchRequest
            .then((result) => {
                if (settledRef.current) return;
                if (!result) throw new Error("Chain switch did not persist.");
                if (!resolve(true)) return;
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

    useEffect(() => {
        if (!isReady || selectedChain || !(chain || activeChain)) return;
        setSelectedChain(chain || activeChain);
    }, [activeChain, chain, isReady, selectedChain]);

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
                                                                    src={chainLogo(newChain?.chainId, newChain?.logo) || ""}
                                                                    alt={newChain?.chainName || ""}
                                                                    style={{ width: "8em", height: "8em", borderRadius: "100%" }}
                                                                />
                                                            </div>
                                                            <Layouts.Col gap={1}>
                                                                <Elements.Text type={"h6"}>{newChain?.chainName}</Elements.Text>
                                                                <Elements.Text type={"strong"} opacity={0.6}>
                                                                    {newChain?.chainId}
                                                                </Elements.Text>
                                                            </Layouts.Col>
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
                                                                        <Elements.Text type={"desc"} weight={"bold"}>
                                                                            <Elements.Text size={1}>
                                                                                {newChain?.rpcUrls?.length > 1
                                                                                    ? t("request.label.chain.rpc.urls")
                                                                                    : t("request.label.chain.rpc.url")}
                                                                            </Elements.Text>
                                                                            {newChain?.rpcUrls?.length > 1 && (
                                                                                <Elements.Text size={1} opacity={1}>
                                                                                    {" "}
                                                                                    +{newChain?.rpcUrls?.length}
                                                                                </Elements.Text>
                                                                            )}
                                                                        </Elements.Text>
                                                                        <Elements.Text>{newChain?.rpcUrls?.[0]}</Elements.Text>
                                                                    </Layouts.Col>
                                                                    <Layouts.Col gap={0.5}>
                                                                        <Elements.Text type={"desc"} weight={"bold"} opacity={0.6}>
                                                                            {t("request.label.native.currency.name")}
                                                                        </Elements.Text>
                                                                        <Elements.Text>{newChain?.nativeCurrency?.name}</Elements.Text>
                                                                    </Layouts.Col>
                                                                    <Layouts.Col gap={0.5}>
                                                                        <Elements.Text type={"desc"} weight={"bold"} opacity={0.6}>
                                                                            {t("request.label.native.currency.symbol")}
                                                                        </Elements.Text>
                                                                        <Elements.Text>{newChain?.nativeCurrency?.symbol}</Elements.Text>
                                                                    </Layouts.Col>
                                                                    <Layouts.Col gap={0.5}>
                                                                        <Elements.Text type={"desc"} weight={"bold"} opacity={0.6}>
                                                                            {t("request.label.native.currency.decimals")}
                                                                        </Elements.Text>
                                                                        <Elements.Text>{newChain?.nativeCurrency?.decimals}</Elements.Text>
                                                                    </Layouts.Col>
                                                                </Layouts.Col>
                                                            </Layouts.Box>
                                                        </Layouts.Col>
                                                    </Layouts.Col>
                                                </Layouts.Col>
                                            </Layouts.Contents.InnerContent>
                                            <Layouts.Col gap={4} align={"center"} style={{ padding: "4em", paddingTop: 0 }}>
                                                <Layouts.Row gap={2}>
                                                    <Controls.Button onClick={handleClose}>{t("app.btn.cancel")}</Controls.Button>
                                                    <Controls.Button type={"line"} onClick={handleAddChain}>
                                                        {t("request.btn.approve")}
                                                    </Controls.Button>
                                                </Layouts.Row>
                                            </Layouts.Col>
                                        </Layouts.Col>
                                    </Layouts.Contents.InnerContent>
                                ),
                            },
                            {
                                active: level === 1,
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
                                                            {t("request.chain.add.prompt", {
                                                                chain: newChainName,
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
                                                <Controls.Button type={count - 1 > 0 ? undefined : "glass"} onClick={handleClose}>
                                                    {t("app.btn.close")}
                                                </Controls.Button>
                                                <Controls.Button type={"line"} onClick={handleSwitchChain}>
                                                    {t("request.btn.chain.switch")}
                                                </Controls.Button>
                                                <AnimatePresence>
                                                    {count - 1 > 0 && (
                                                        <motion.div
                                                            initial={{ flex: 2, marginTop: "-2em", maxHeight: 0 }}
                                                            animate={{ flex: 2, marginTop: 0, maxHeight: "100vh" }}
                                                            exit={{ flex: 2, marginTop: 0, maxWidth: "max-content" }}
                                                            transition={{ ease: "easeInOut", duration: 0.3 }}>
                                                            <Controls.Button type={"glass"} onClick={handleNext} style={{ width: "100%" }}>
                                                                {t("request.btn.next")}
                                                            </Controls.Button>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </Layouts.Row>
                                        </Layouts.Col>
                                    </Layouts.Col>
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
                                                <Layouts.Row gap={2}>
                                                    <Controls.Button type={count ? undefined : "glass"} onClick={handleClose}>
                                                        {t("app.btn.close")}
                                                    </Controls.Button>
                                                    <RequestCloseNextActions
                                                        count={count}
                                                        onClose={handleClose}
                                                        onNext={() => setId(next(id) || "")}
                                                        closeLabel={t("app.btn.close")}
                                                        nextLabel={t("request.btn.next")}
                                                    />
                                                </Layouts.Row>
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
