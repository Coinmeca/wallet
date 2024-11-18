"use client";

import { Contents, Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { format } from "@coinmeca/ui/lib/utils";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { Account, TransactionParams } from "@coinmeca/wallet-sdk/types";
import { GetEstimateGas, GetGasPrice, GetMaxFeePerGas } from "api/onchain";
import { useMessageHandler, useTelegram } from "hooks";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { formatChainId } from "utils";

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
const timeout = 1000;

export default function Page() {
    const router = useRouter();

    const { telegram } = useTelegram();
    const { provider, chain, account } = useCoinmecaWalletProvider();
    const { auth, app, params, isPopup, messageId } = useMessageHandler();

    const [tx, setTx] = useState<TransactionParams>();
    const [level, setLevel] = useState(0);
    const [signer, setSigner] = useState<Account>();

    const [spender, setSpender] = useState<string>("");
    const [amount, setAmount] = useState<number>(0);

    const [txHash, setTxHash] = useState<string>("");
    const [error, setError] = useState<any>();

    const { data: gasPrice, isLoading: isGasPriceLoading } = GetGasPrice(chain?.rpcUrls[0]);
    const { data: estimateGas, isLoading: isEstimateGasLoading } = GetEstimateGas(chain?.rpcUrls[0], tx);
    const { data: maxPriorityFeePerGas } = GetEstimateGas(chain?.rpcUrls[0], tx);
    const { data: maxFeePerGas } = GetMaxFeePerGas(chain?.rpcUrls[0]);

    useLayoutEffect(() => {
        if (params) {
            console.log({ params, auth, app });
            const { data } = params;
            if (data) {
                setSpender("0x" + data.slice(34, 74));
                setAmount(Number(BigInt("0x" + data.slice(74, 138)).toString()));
            }
            if (params?.chainId) provider?.changeChain(params.chainId);
            setTx(params);
            setSigner(provider?.account(params?.from || account?.address));
        }
    }, []);

    const handleSign = async () => {
        setLevel(1);
        console.log("send", {
            ...params,
            chainId: params?.chainId || chain?.chainId,
            gasLimit: `0x${estimateGas?.raw?.toString(16)}`, // Convert estimateGas to hex format
            maxFeePerGas: `0x${maxFeePerGas?.raw?.toString(16)}`, // Convert maxFeePerGas to hex format
            maxPriorityFeePerGas: `0x${maxPriorityFeePerGas?.raw?.toString(16)}`, // Convert maxPriorityFeePerGas to hex format
        });
        try {
            const result = await provider
                ?.sign(
                    {
                        ...params,
                        chainId: params?.chainId || chain?.chainId,
                        gasLimit: `0x${estimateGas?.raw?.toString(16)}`, // Correct gasLimit
                        maxFeePerGas: `0x${maxFeePerGas?.raw?.toString(16)}`, // Correct maxFeePerGas
                        maxPriorityFeePerGas: `0x${maxPriorityFeePerGas?.raw?.toString(16)}`, // Correct maxPriorityFeePerGas
                    },
                    signer!,
                )
                .then(async (tx: any) => await provider?.send(tx));
            if (result) {
                window?.opener?.postMessage(
                    {
                        method,
                        result,
                        id: messageId,
                    },
                    "*",
                );
            } else {
                throw new Error(result);
            }
            setTxHash(result);
            setLevel(2);
            setTimeout(handleClose, timeout);
        } catch (error: any) {
            console.log(error);
            error = error?.message || error;
            window?.opener?.postMessage(
                {
                    method,
                    error,
                    id: messageId,
                },
                "*",
            );
            setError(error);
            setLevel(3);
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
                    id: messageId,
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
                                                        {signer?.address?.substring(0, signer?.address.startsWith("0x") ? 8 : 6) +
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
                                                        {tx?.to?.substring(0, tx?.to?.startsWith("0x") ? 8 : 6) +
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
                                                            Amount
                                                        </Elements.Text>
                                                        <Elements.Text>
                                                            {amount}
                                                            {/* {format(amount, "currency", {
                                                                unit: 9,
                                                                limit: 12,
                                                                fix: 9,
                                                            })} */}
                                                        </Elements.Text>
                                                    </Layouts.Col>
                                                    <Layouts.Col gap={0}>
                                                        <Elements.Text type={"desc"} weight={"bold"} opacity={0.6}>
                                                            Spender
                                                        </Elements.Text>
                                                        <Layouts.Row gap={1} align={"center"} fix>
                                                            <Elements.Text align={"left"} title={spender}>
                                                                {spender?.substring(0, spender.startsWith("0x") ? 8 : 6) +
                                                                    " ... " +
                                                                    spender?.substring(spender?.length - 6, spender?.length)}
                                                            </Elements.Text>
                                                            <Controls.Button icon={"copy"} fit />
                                                        </Layouts.Row>
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
                                                <Elements.Text opacity={0.6}>
                                                    {txHash?.substring(0, txHash?.startsWith("0x") ? 8 : 6) +
                                                        "..." +
                                                        txHash?.substring(txHash?.length - 6, txHash?.length)}
                                                </Elements.Text>{" "}
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
                        {console.log({ auth, app, signer, tx })}
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
    );
}
