"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Contents, Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { Account } from "@coinmeca/wallet-sdk/types";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { format } from "@coinmeca/ui/lib/utils";
import { useQueries } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";

import { useMessageHandler } from "hooks";
import { query } from "api/onchain/query";
import { GetMaxFeePerGas } from "api/onchain";
import { sanitizeBigIntToHex, short } from "utils";

/*
await window.ethereum.providerMap.get("CoinmecaWallet").request({
        method: 'eth_signTransaction',
        params: [
          {
            from: '0xc8b95755888a2be3f8fa19251f241a1e8b74f933',
            to: '0x0000000000000000000000000000000000000000',
            value: '0x0',
            gasLimit: '0x5028',
            maxFeePerGas: '0x2540be400',
            maxPriorityFeePerGas: '0x3b9aca00',
          },
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

const method = "eth_signTransaction";
const timeout = 5000;

export default function EthSignTransaction() {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const { provider, chain, account } = useCoinmecaWalletProvider();
    const { getRequest, getRequestById, success, failure, next, count, setCurrent, close } = useMessageHandler();

    const [load, setLoad] = useState(true);
    const [id, setId] = useState("");

    const [level, setLevel] = useState(0);
    const [error, setError] = useState<any>();

    const { app, auth, params, tx, signer } = useMemo(() => {
        let tx: Transaction | undefined;
        let signer: Account | undefined;

        const { app, auth, params } = getRequestById(id);

        if (params?.chainId) provider?.changeChain(params.chainId);

        tx = params;
        signer = provider?.account(tx?.from || account?.address);

        return {
            app,
            auth,
            params,
            tx,
            signer,
        };
    }, [id]);

    const [{ data: nonce }, { data: gasPrice, isLoading: isGasPriceLoading }, { data: estimateGas, isLoading: isEstimateGasLoading }] = useQueries({
        queries: [
            query.nonce(chain?.rpcUrls?.[0], signer?.address),
            query.gasPrice(chain?.rpcUrls?.[0]),
            query.estimateGas(chain?.rpcUrls?.[0], sanitizeBigIntToHex(tx)),
        ],
    });
    const {
        data: { maxPriorityFeePerGas, maxFeePerGas },
    } = GetMaxFeePerGas(chain?.rpcUrls?.[0]);

    const handleClose = () => {
        if (level < 2) failure(id, "User rejected the request");
        close(id);
    };

    const handleSign = async () => {
        setLevel(1);
        await provider
            ?.sign(
                {
                    to: tx?.to,
                    data: tx?.data,
                    nonce: BigInt(nonce || 0),
                    gasLimit: BigInt(estimateGas?.raw || 0),
                    gasPrice: BigInt(gasPrice?.raw || 0),
                    chainId: Number(params?.chainId || chain?.chainId),
                    maxFeePerGas: BigInt(maxFeePerGas?.raw || 0),
                    maxPriorityFeePerGas: BigInt(maxPriorityFeePerGas?.raw || 0),
                } as any,
                signer!,
            )
            .then((result) => {
                success(id, result);
                setLevel(2);
                if (count <= 1) timeoutRef.current = setTimeout(handleClose, timeout);
            })
            .catch((error) => {
                console.log(error);
                failure(id, "Failed to signning");
                setError(error);
                setLevel(3);
            });
    };

    useEffect(() => {
        if (count && timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, [count]);

    useEffect(() => {
        if (id && id !== "") {
            setLoad(false);
            setCurrent(id);
            setError(undefined);
            setLevel(0);
            setTimeout(() => setLoad(true), 300);
        }
    }, [id]);

    useLayoutEffect(() => {
        const id = getRequest(method)?.id;
        setId(id);
    }, []);

    return (
        <AnimatePresence>
            {load &&
                (auth && app && signer && tx ? (
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
                                                                        title={app?.name || ""}
                                                                        alt={app?.name || ""}
                                                                        style={{ width: "100%", height: "100%", borderRadius: "100%" }}
                                                                    />
                                                                    <Image
                                                                        src={chain?.logo || ""}
                                                                        width={0}
                                                                        height={0}
                                                                        title={chain?.chainName || ""}
                                                                        alt={chain?.chainName || ""}
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
                                                                    Requested By
                                                                </Elements.Text>
                                                                <Layouts.Col gap={0}>
                                                                    <Elements.Text type={"h6"} height={0} align={"left"}>
                                                                        {app?.name}
                                                                    </Elements.Text>
                                                                    <Elements.Text type={"strong"} height={0} align={"left"} opacity={0.6}>
                                                                        {app?.url}
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
                                                                <Elements.Avatar
                                                                    character={`${signer?.index + 1}`}
                                                                    name={`${signer?.index + 1}`}
                                                                    title={signer?.name}
                                                                    hideName
                                                                />
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
                                                                    To
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
                                                                        Gas Price
                                                                    </Elements.Text>
                                                                    <Elements.Text>
                                                                        {isGasPriceLoading
                                                                            ? "~"
                                                                            : format(gasPrice?.format, "currency", {
                                                                                  unit: 9,
                                                                                  limit: 12,
                                                                                  fix: 9,
                                                                              })}
                                                                    </Elements.Text>
                                                                </Layouts.Col>
                                                                <Layouts.Col gap={0.5}>
                                                                    <Elements.Text type={"desc"} weight={"bold"} opacity={0.6}>
                                                                        Estimated Gas
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
                                                                        Total
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
                                                                            {chain?.nativeCurrency?.symbol}
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
                                                    Close
                                                </Controls.Button>
                                                <Controls.Button type={"line"} onClick={handleSign}>
                                                    Sign
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
                                                                alt={app.name || ""}
                                                                style={{ width: "12em", height: "12em" }}
                                                            />
                                                        </div>
                                                        <Layouts.Col gap={0} align={"center"}>
                                                            <Elements.Text type={"h6"} height={0}>
                                                                {app?.name}
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
                                                        <Elements.Text type={"h3"}>Complete</Elements.Text>
                                                        <Elements.Text size={1} weight={"bold"}>
                                                            {/* <Elements.Text opacity={0.6}>{short(fixme)}</Elements.Text>{" "} */}
                                                            <Elements.Text opacity={0.6}>Selected chain was switched from</Elements.Text>{" "}
                                                            <Elements.Text>{app?.name}</Elements.Text> <Elements.Text opacity={0.6}>to</Elements.Text>{" "}
                                                            <Elements.Text>{` ${tx?.to}`}</Elements.Text>
                                                            <Elements.Text opacity={0.6}>.</Elements.Text>
                                                        </Elements.Text>
                                                    </Layouts.Col>
                                                </Layouts.Col>
                                                <Layouts.Col gap={4} align={"center"} style={{ margin: 0 }} fit>
                                                    <Layouts.Row gap={2}>
                                                        <Controls.Button type={count ? undefined : "glass"} onClick={handleClose}>
                                                            Close
                                                        </Controls.Button>
                                                        <AnimatePresence>
                                                            {!!count && (
                                                                <motion.div
                                                                    initial={{ flex: 0, marginLeft: "-2em", maxWidth: 0 }}
                                                                    animate={{ flex: 2, marginLeft: 0, maxWidth: "100vw" }}
                                                                    exit={{ flex: 2, marginLeft: 0, maxWidth: "100vw" }}
                                                                    transition={{ ease: "easeInOut", duration: 0.3 }}>
                                                                    <Controls.Button
                                                                        type={"glass"}
                                                                        onClick={() => setId(next(id) || "")}
                                                                        style={{ width: "100%" }}>
                                                                        See Next Request
                                                                    </Controls.Button>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </Layouts.Row>{" "}
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
                                                            <Elements.Text type={"h3"}>Failure</Elements.Text>
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
                                                        Close
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
                                            <Elements.Text type={"h3"}>Invalid Request</Elements.Text>
                                            <Elements.Text weight={"bold"} opacity={0.6}>
                                                {"The given transaction information is something wrong. Couldn't found the information of requested chain."}
                                            </Elements.Text>
                                        </Layouts.Col>
                                    </Layouts.Col>
                                </Layouts.Col>
                            </Layouts.Contents.InnerContent>
                            <Layouts.Col gap={4} align={"center"} style={{ padding: "4em", paddingTop: 0 }}>
                                <Layouts.Row gap={2}>
                                    <Controls.Button type={"glass"} onClick={handleClose}>
                                        Close
                                    </Controls.Button>
                                </Layouts.Row>
                            </Layouts.Col>
                        </Layouts.Col>
                    </Layouts.Contents.InnerContent>
                ))}
        </AnimatePresence>
    );
}
