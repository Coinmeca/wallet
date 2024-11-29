"use client";

import Image from "next/image";
import { useState } from "react";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { format } from "@coinmeca/ui/lib/utils";
import { useQueries } from "@tanstack/react-query";

import { query } from "api/onchain/query";
import { GetMaxFeePerGas } from "api/onchain";
import { sanitizeBigIntToHex, short } from "utils";
import { Asset } from "types";
import { Stage } from "..";

interface Tx extends Stage {
    asset?: Asset;
    amount?: number;
    recipient?: string;
    onBack?: Function;
    onComplete?: Function;
}

export default function Tx(props: Tx) {
    const level = props?.stage?.level || 0;
    const asset = props?.asset;
    const amount = props.amount || 0;
    const recipient = props.recipient || "";

    const { chain, account } = useCoinmecaWalletProvider();
    const [tx, setTx] = useState<any>();
    const [error, setError] = useState<any>();

    const [{ data: nonce }, { data: gasPrice, isLoading: isGasPriceLoading }, { data: estimateGas, isLoading: isEstimateGasLoading }] = useQueries({
        queries: [
            query.nonce(chain?.rpcUrls[0], account?.address),
            query.gasPrice(chain?.rpcUrls[0]),
            query.estimateGas(chain?.rpcUrls[0], sanitizeBigIntToHex(tx)),
        ],
    });

    const {
        data: { maxPriorityFeePerGas, maxFeePerGas },
    } = GetMaxFeePerGas(chain?.rpcUrls[0]);

    const handleBack = () => {
        props?.onBack?.();
    };

    const handleGoToMain = () => {
        props?.onComplete?.();
    };

    const handleSend = () => {
        setTx({
            method: "eth_sendTransaction",
            to: asset?.address,
            from: account?.address,
            data:
                `0xa9059cbb` +
                recipient.toLowerCase().padStart(64, "0") +
                BigInt(Number(amount) * 10 ** (asset?.decimals || 0))
                    .toString(16)
                    .padStart(64, "0"),
            nonce: BigInt(nonce || 0),
            chainId: Number(chain?.chainId || 1),
            gasLimit: BigInt(estimateGas?.raw || 0),
            gasPrice: BigInt(gasPrice?.raw || 0),
            maxFeePerGas: BigInt(maxFeePerGas?.raw || 0),
            maxPriorityFeePerGas: BigInt(maxPriorityFeePerGas?.raw || 0),
        });
    };

    return (
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
                                                            level === 2
                                                                ? `https://web3.coinmeca.net/${chain?.chainId}/${asset?.address?.toLowerCase()}/logo.svg`
                                                                : require(`../../../assets/animation/${level === 3 ? "success" : "failure"}.gif`)
                                                        }
                                                        alt={asset?.symbol || "Unknown"}
                                                        style={{ width: "8em", height: "8em" }}
                                                    />
                                                </div>
                                                <Layouts.Col gap={1}>
                                                    <Elements.Text type={"h6"}>{asset?.symbol || ""}</Elements.Text>
                                                    <Elements.Text type={"strong"} opacity={0.6}>
                                                        {asset?.name}
                                                    </Elements.Text>
                                                </Layouts.Col>
                                            </Layouts.Col>
                                        </Layouts.Col>
                                        {/* <Layouts.Col gap={8} align={"center"} style={{ flex: 1 }} fill> */}
                                        <Layouts.Contents.SlideContainer
                                            style={{ flex: 1 }}
                                            contents={[
                                                {
                                                    active: level < 2,
                                                    children: <></>,
                                                },
                                                {
                                                    active: level === 2,
                                                    style: { display: "flex", minHeight: "max-content" },
                                                    children: (
                                                        <Layouts.Col gap={8} style={{ flex: 1, height: "100%", minHeight: "max-content" }} fill>
                                                            <Layouts.Col style={level === 2 ? { minHeight: "max-content" } : {}} reverse fill>
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
                                                                                {/* // error: if 0, wrong tx */}
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
                                                                                        : format(
                                                                                              (gasPrice?.format || 0) * (estimateGas?.format || 0),
                                                                                              "currency",
                                                                                              {
                                                                                                  unit: 9,
                                                                                                  limit: 12,
                                                                                                  fix: 9,
                                                                                              },
                                                                                          )}
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
                                                    ),
                                                },
                                                {
                                                    active: level === 3,
                                                    children: (
                                                        <Layouts.Col gap={0} align={"center"} style={{ height: "100%" }} fill>
                                                            <Layouts.Col gap={4} align={"center"} fit>
                                                                <Elements.Text type={"h3"}>Complete</Elements.Text>
                                                                <Elements.Text size={1} weight={"bold"}>
                                                                    <Elements.Text opacity={0.6}>Comepete to connect</Elements.Text>{" "}
                                                                    <Elements.Text>{account?.name}</Elements.Text>{" "}
                                                                    <Elements.Text opacity={0.6}>({short(account?.address)}) to</Elements.Text>{" "}
                                                                    <Elements.Text>{asset?.symbol}</Elements.Text>{" "}
                                                                    <Elements.Text opacity={0.6}>({asset?.name}).</Elements.Text>
                                                                </Elements.Text>
                                                            </Layouts.Col>
                                                        </Layouts.Col>
                                                    ),
                                                },
                                                {
                                                    active: level === 4,
                                                    children: (
                                                        <Layouts.Col gap={0} align={"center"} style={{ height: "100%" }} fill>
                                                            <Layouts.Col gap={4} align={"center"} fit>
                                                                <Elements.Text type={"h3"}>Failure</Elements.Text>
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
                                                active: level === 1,
                                                children: <></>,
                                            },
                                            {
                                                active: level === 2,
                                                children: (
                                                    <Layouts.Row gap={2}>
                                                        <Controls.Button type={"glass"} onClick={handleBack}>
                                                            Cancel
                                                        </Controls.Button>
                                                        <Controls.Button type={"line"} onClick={handleSend}>
                                                            Send
                                                        </Controls.Button>
                                                    </Layouts.Row>
                                                ),
                                            },
                                            {
                                                active: level > 2,
                                                children: (
                                                    <Layouts.Row gap={2}>
                                                        <Controls.Button type={"glass"} onClick={handleGoToMain}>
                                                            Go to main
                                                        </Controls.Button>
                                                    </Layouts.Row>
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
    );
}
