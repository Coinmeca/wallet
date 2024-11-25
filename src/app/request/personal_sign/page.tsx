"use client";

import { Contents, Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { useMessageHandler, useTelegram } from "hooks";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { Account } from "@coinmeca/wallet-sdk/types";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { GetMaxFeePerGas } from "api/onchain";
import { format } from "@coinmeca/ui/lib/utils";
import { useQueries } from "@tanstack/react-query";
import { query } from "api/onchain/query";
import { sanitizeBigIntToHex, short } from "utils";
import { valid } from "@coinmeca/wallet-sdk/utils";

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

const method = "personal_sign";
const timeout = 5000;

export default function PersonalSign() {
    const router = useRouter();

    const { telegram } = useTelegram();
    const { provider, chain, account } = useCoinmecaWalletProvider();
    const { app, params, isPopup, messageId } = useMessageHandler();

    const [message, setMessage] = useState<string>();
    const [signer, setSigner] = useState<Account>();
    const [auth, setAuth] = useState<boolean>();

    const [level, setLevel] = useState(0);
    const [error, setError] = useState<any>();

    useLayoutEffect(() => {
        console.log({ params, auth, app });
        if (params) {
            const _0 = valid.address(params[0]);
            const _1 = valid.address(params[1]);

            let message;
            let address;

            if (_0 || _1) {
                _1 ? ((message = params[0]), (address = params[1])) : ((message = params[1]), (address = params[0]));

                setAuth(app?.url ? provider?.allowance(app?.url, address) : false);
                setSigner(provider?.account(address));
                setMessage(message);
            }
        }
    }, []);

    const handleSign = async () => {
        setLevel(1);
        await provider
            ?.signMessage([message!, signer!.address])
            .then((result) => {
                window?.opener?.postMessage(
                    {
                        method,
                        result,
                        id: messageId,
                    },
                    "*",
                );
                setLevel(1);
                // setTimeout(handleClose, timeout);
            })
            .catch((error) => {
                console.log(error);
                window?.opener?.postMessage(
                    {
                        method,
                        error: "Failed to signning",
                        id: messageId,
                    },
                    "*",
                );
                setError(error);
                setLevel(2);
            });
    };

    const handleClose = () => {
        // if (isPopup) {
        if (telegram) telegram?.close();
        window?.close();
        // } else router.push("/");
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

    return auth && app && signer && message ? (
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
                                                        alt={app.name || "Unknown"}
                                                        style={{ width: "8em", height: "8em" }}
                                                    />
                                                </div>
                                                <Layouts.Col gap={1}>
                                                    <Elements.Text type={"h6"}>{app.name || ""}</Elements.Text>
                                                    <Elements.Text type={"strong"} opacity={0.6}>
                                                        {app.url}
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
                                                                                Message
                                                                            </Elements.Text>
                                                                            <Elements.Text>{message}</Elements.Text>
                                                                        </Layouts.Col>
                                                                    </Layouts.Col>
                                                                </Layouts.Box>
                                                            </Layouts.Col>
                                                        </Layouts.Col>
                                                    ),
                                                },
                                                {
                                                    active: level === 1,
                                                    children: (
                                                        <Layouts.Col gap={0} align={"center"} style={{ height: "100%" }} fill>
                                                            <Layouts.Col gap={4} align={"center"} fit>
                                                                <Elements.Text type={"h3"}>Complete</Elements.Text>
                                                                <Elements.Text size={1} weight={"bold"}>
                                                                    <Elements.Text opacity={0.6}>Signed in requested message with</Elements.Text>{" "}
                                                                    <Elements.Text>{`${signer?.name}(${short(signer?.address)})`}</Elements.Text>{" "}
                                                                    <Elements.Text opacity={0.6}>in</Elements.Text>{" "}
                                                                    <Elements.Text>{` ${app?.url}`}</Elements.Text>
                                                                    <Elements.Text opacity={0.6}>.</Elements.Text>
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
                                                active: level === 0,
                                                children: (
                                                    <Layouts.Row gap={2}>
                                                        <Controls.Button type={"glass"} onClick={handleClose}>
                                                            Cancel
                                                        </Controls.Button>
                                                        <Controls.Button type={"line"} onClick={handleSign}>
                                                            Sign
                                                        </Controls.Button>
                                                    </Layouts.Row>
                                                ),
                                            },
                                            {
                                                active: level > 0,
                                                children: (
                                                    <Layouts.Row gap={2}>
                                                        <Controls.Button type={"glass"} onClick={handleClose}>
                                                            Close
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
                                    {"The given app information is something wrong. Couldn't found the information of requested app."}
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
