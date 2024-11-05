"use client";

import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { x64 } from "crypto-js";
import { Transaction } from "ethereumjs-tx";
import { useAccount, usePopupChecker, useStorage, useTelegram } from "hooks";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { TransactionParams } from "wallet/provider";

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

export default function eth_sendTransaction({ params }: { params: any }) {
    const method = "eth_sendTransaction";
    const router = useRouter();

    const { telegram } = useTelegram();
    const { isPopup } = usePopupChecker();
    const { storage, session } = useStorage();

    const [app, setApp] = useState<any>();
    const [tx, setTx] = useState<TransactionParams>();
    const [level, setLevel] = useState(0);

    useLayoutEffect(() => {
        if ((window as any)?.coinmeca) {
            const params = (window as any)?.coinmeca?.params || (window as any)?.coinmeca?.params;
            if (params) {
                const { value, gasLimit, maxFeePerGas, maxPriorityFeePerGas } = params?.[0];
                setTx({
                    ...params?.[0],
                    value: value && value !== "" ? parseInt(value, 16) : undefined,
                    gasLimit: gasLimit && gasLimit !== "" ? parseInt(gasLimit, 16) : undefined,
                    maxFeePerGas: maxFeePerGas && maxFeePerGas !== "" ? parseInt(maxFeePerGas, 16) : undefined,
                    maxPriorityFeePerGas: maxPriorityFeePerGas && maxPriorityFeePerGas !== "" ? parseInt(maxPriorityFeePerGas, 16) : undefined,
                });

                const url = params?.[1]?.appUrl || params?.url;
                const site = url && decodeURIComponent(url);
                const origin = site && new URL(site.startsWith("http") ? site : `https://${site}`).host;
                const app = {
                    name: params?.[1]?.appName || params?.[1]?.name || undefined,
                    logo: params?.[1]?.appLogo || params?.[1]?.logo || params?.[1]?.appIcon || params?.[1]?.icon || undefined,
                    url: origin || undefined,
                };
                if (app?.name && app?.name !== "" && app?.url && app?.url !== "") setApp(app);
            }
        }
    }, []);

    const handleSign = () => {
        const key = storage?.get(`${session?.get("key")}:wallets`)?.[storage?.get(tx?.from?.toLowerCase()!)?.index];
        
        if(key) {
            const result = new Transaction(tx as any);
            result.sign(Buffer.from(key.substring(0, 64), "hex"))
            window?.opener?.postMessage(
                {
                    method,
                    result: result.serialize()
                },
                "*"
            );
        } else {
            window?.opener?.postMessage(
                {
                    method,
                    error: "Failed to signning"
                },
                "*",
            );
        }
        
        setLevel(1);
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

    return app && tx ? (
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
                                                    <Image src={app?.logo || ""} width={0} height={0} alt={app?.name} style={{ width: "4em", height: "4em" }} />
                                                </div>
                                                <Layouts.Col gap={0} align={"center"} fill>
                                                    <Elements.Text type={"h6"} height={0} align={"left"}>
                                                        {app?.name}
                                                    </Elements.Text>
                                                    <Elements.Text type={"strong"} height={0} align={"left"} opacity={0.6}>
                                                        {app?.url}
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
                                                        name={tx?.to}
                                                        hideName
                                                    />
                                                </div>
                                                <Layouts.Col gap={0} align={"center"}>
                                                    <Elements.Text type={"h6"} height={0} align={"left"}>
                                                        {(tx?.to?.startsWith("0x") ? tx?.to?.substring(0, 8) : tx?.to?.substring(0, 6)) + " ... " + tx?.to?.substring(tx?.to?.length - 6, tx?.to?.length)}
                                                    </Elements.Text>
                                                    <Elements.Text type={"strong"} height={0} align={"left"} opacity={0.6}>
                                                        {tx?.value}
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
                                                        <Elements.Text size={1.25} opacity={0.6}>
                                                            <Elements.Text size={1} opacity={0.6}>
                                                                Chain RPC URL
                                                            </Elements.Text>
                                                            {tx.gas}
                                                        </Elements.Text>
                                                        <Elements.Text>{tx.gasPrice}</Elements.Text>
                                                    </Layouts.Col>
                                                    <Layouts.Col gap={0.5}>
                                                        <Elements.Text size={1.25} opacity={0.6}>
                                                            Estimated Gas
                                                        </Elements.Text>
                                                        {/* <Elements.Text>{tx.gas * tx.gasPrice}</Elements.Text> */}
                                                    </Layouts.Col>
                                                    <Layouts.Col gap={0.5}>
                                                        <Elements.Text size={1.25} opacity={0.6}>
                                                            Data
                                                        </Elements.Text>
                                                        <Elements.Text>{tx.data}</Elements.Text>
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
            <Layouts.Col align={"center"} style={{ padding: "4em" }} fill>
                <Layouts.Col gap={4} align={"center"} style={{ flex: 1 }} fill>
                    <Layouts.Col gap={4} align={"center"} fill>
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
                </Layouts.Col>
                <Layouts.Col gap={0} align={"center"} style={{ flex: 1 }} fill>
                    <Layouts.Col align={"center"} style={{ flex: 1 }} fill>
                        <Layouts.Col gap={4} align={"center"} fit>
                            <Elements.Text type={"h3"}>Invalid Request</Elements.Text>
                            <Elements.Text weight={"bold"} opacity={0.6}>
                                The given chain information is something wrong. Couldn't found the information of requested chain.
                            </Elements.Text>
                        </Layouts.Col>
                    </Layouts.Col>
                    <Layouts.Row gap={2}>
                        <Controls.Button type={"glass"} onClick={handleClose}>
                            Cancel
                        </Controls.Button>
                    </Layouts.Row>
                </Layouts.Col>
            </Layouts.Col>
        </Layouts.Contents.InnerContent>
    );
}
