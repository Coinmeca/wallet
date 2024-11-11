"use client";

import { Contents, Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { useMessageHandler, useTelegram } from "hooks";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { Account, TransactionParams } from "@coinmeca/wallet-sdk/types";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-sdk/contexts";
import { GetEstimateGas, GetGasPrice } from "api/onchain";
import { format } from "@coinmeca/ui/lib/utils";

/*
await window.ethereum.providerMap.get("CoinmecaWallet").request({
        method: 'eth_sendTransaction',
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

export default function eth_sendTransaction() {
    const method = "eth_sendTransaction";
    const router = useRouter();

    const { telegram } = useTelegram();
    const { provider, chain } = useCoinmecaWalletProvider();
    const { auth, app, params, isPopup } = useMessageHandler();

    const [tx, setTx] = useState<Transaction>();
    const [level, setLevel] = useState(0);
    const [signer, setSigner] = useState<Account>();
    const [loading, setLoading] = useState(false);

    const { data: gasPrice, isLoading: isGasPriceLoading } = GetGasPrice(chain?.rpcUrls[0]);
    const { data: estimateGas, isLoading: isEstimateGasLoading } = GetEstimateGas(chain?.rpcUrls[0], tx);

    console.log(gasPrice, estimateGas);

    useLayoutEffect(() => {
        console.log({ params, auth, app });
        if (params) {
            const { value, gasLimit, maxFeePerGas, maxPriorityFeePerGas } = params;
            const tx = {
                ...params,
                value: Number(value),
                gasLimit: Number(gasLimit),
                maxFeePerGas: Number(maxFeePerGas),
                maxPriorityFeePerGas: Number(maxPriorityFeePerGas),
            };
            setTx(tx);
            setSigner(provider?.account(tx?.from));
        }
    }, []);

    const handleSign = async () => {
        setLevel(1);
        try {
            const result = await provider?.sign({ ...params, chainId: chain?.chainId }, signer!);
            if (result) {
                window?.opener?.postMessage(
                    {
                        method,
                        result,
                    },
                    "*",
                );
            } else {
                throw new Error(result);
            }
        } catch (error) {
            console.log(error);
            window?.opener?.postMessage(
                {
                    method,
                    error: "Failed to signning",
                },
                "*",
            );
        } finally {
            setLevel(2);
        }
    };

    const handleClose = () => {
        if (isPopup) {
            if (telegram) telegram?.close();
            window?.close();
        } else router.push("/");
        if (level < 2)
            window?.opener?.postMessage(
                {
                    method,
                    ...(level === 0 ? { error: "User rejected the request" } : {}),
                },
                "*",
            );
    };

    return auth && app && signer && tx ? (
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
                                                        src={app?.logo || ""}
                                                        width={0}
                                                        height={0}
                                                        alt={app?.name || ""}
                                                        style={{ width: "4em", height: "4em", borderRadius: "100%" }}
                                                    />
                                                </div>
                                                <Layouts.Col gap={0} align={"center"} fill>
                                                    <Elements.Text height={0} align={"left"} opacity={0.6}>
                                                        Requested By
                                                    </Elements.Text>
                                                    <Elements.Text type={"h6"} height={0} align={"left"}>
                                                        {app?.name}
                                                    </Elements.Text>
                                                    <Elements.Text type={"strong"} height={0} align={"left"} opacity={0.6}>
                                                        {app?.url}
                                                    </Elements.Text>
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
                                                    <Elements.Avatar character={`${signer?.index + 1}`} name={`${signer?.index + 1}`} hideName />
                                                </div>
                                                <Layouts.Col gap={0} align={"center"}>
                                                    <Elements.Text type={"h6"} height={0} align={"left"}>
                                                        {signer?.name}
                                                    </Elements.Text>
                                                    <Elements.Text type={"strong"} height={0} align={"left"} opacity={0.6}>
                                                        {(signer?.address.startsWith("0x")
                                                            ? signer?.address?.substring(0, 8)
                                                            : signer?.address?.substring(0, 6)) +
                                                            " ... " +
                                                            signer?.address?.substring(signer?.address?.length - 6, signer?.address?.length)}
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
                                                        character={tx?.to?.startsWith("0x") ? tx?.to?.substring(2, 4) : tx?.to?.substring(0, 2)}
                                                        name={"To"}
                                                        hideName
                                                    />
                                                </div>
                                                <Layouts.Col gap={0} align={"center"}>
                                                    <Elements.Text type={"h6"} height={0} align={"left"}>
                                                        To
                                                    </Elements.Text>
                                                    <Elements.Text type={"strong"} height={0} align={"left"} opacity={0.6}>
                                                        {(tx?.to?.startsWith("0x") ? tx?.to?.substring(0, 8) : tx?.to?.substring(0, 6)) +
                                                            " ... " +
                                                            tx?.to?.substring(tx?.to?.length - 6, tx?.to?.length)}
                                                    </Elements.Text>
                                                </Layouts.Col>
                                            </Layouts.Row>
                                        </Layouts.Col>
                                    </Layouts.Col>
                                    <Layouts.Col gap={8} style={{ flex: 1 }} fill>
                                        <Layouts.Col reverse fill>
                                            <Layouts.Box
                                                style={{
                                                    background: "rgba(var(--black),.6)",
                                                    maxHeight: "max-content",
                                                    padding: "clamp(2em, 7.5%, 4em)",
                                                    width: "auto",
                                                    height: "auto",
                                                }}
                                                fit>
                                                <Layouts.Col gap={2} align={"left"}>
                                                    <Layouts.Col gap={0.5}>
                                                        <Elements.Text size={1.25} opacity={0.6}>
                                                            <Elements.Text size={1} opacity={0.6}>
                                                                Gas Price
                                                            </Elements.Text>
                                                        </Elements.Text>
                                                        <Elements.Text>
                                                            {isGasPriceLoading
                                                                ? "~"
                                                                : format(gasPrice, "currency", {
                                                                      unit: 9,
                                                                      limit: 12,
                                                                      fix: 9,
                                                                  })}
                                                        </Elements.Text>
                                                    </Layouts.Col>
                                                    <Layouts.Col gap={0.5}>
                                                        <Elements.Text size={1.25} opacity={0.6}>
                                                            <Elements.Text size={1} opacity={0.6}>
                                                                Estimated Gas
                                                            </Elements.Text>
                                                        </Elements.Text>
                                                        <Elements.Text>
                                                            {isEstimateGasLoading
                                                                ? "~"
                                                                : format(estimateGas, "currency", {
                                                                      unit: 9,
                                                                      limit: 12,
                                                                      fix: 9,
                                                                  })}
                                                        </Elements.Text>
                                                    </Layouts.Col>
                                                    <Layouts.Col gap={0.5}>
                                                        <Elements.Text size={1.25} opacity={0.6}>
                                                            Total
                                                        </Elements.Text>
                                                        <Layouts.Row gap={1} fix>
                                                            <Elements.Text style={{ flex: "initial" }} fix>
                                                                {isGasPriceLoading || isEstimateGasLoading
                                                                    ? "~"
                                                                    : format((gasPrice || 0) * (estimateGas || 0), "currency", {
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
                                                <Elements.Text opacity={0.6}>Selected chain was switched from</Elements.Text>{" "}
                                                <Elements.Text>{app?.name}</Elements.Text> <Elements.Text opacity={0.6}>to</Elements.Text>{" "}
                                                <Elements.Text>{` ${tx?.to}`}</Elements.Text>
                                                <Elements.Text opacity={0.6}>.</Elements.Text>
                                            </Elements.Text>
                                        </Layouts.Col>
                                    </Layouts.Col>
                                    <Layouts.Col gap={4} align={"center"} style={{ margin: 0 }} fit>
                                        <Controls.Button type={"glass"} onClick={handleClose}>
                                            Close
                                        </Controls.Button>
                                    </Layouts.Col>
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
                                        alt={"Unknown"}
                                        style={{ width: "8em", height: "8em" }}
                                    />
                                </div>
                            </Layouts.Col>
                        </Layouts.Col>
                        <Layouts.Col gap={8} align={"center"} style={{ flex: 1 }} fill>
                            <Layouts.Col gap={4} align={"center"} fit>
                                <Elements.Text type={"h3"}>Invalid Request</Elements.Text>
                                <Elements.Text weight={"bold"} opacity={0.6}>
                                    The given transaction information is something wrong. Couldn't found the information of requested chain.
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
    );
}
