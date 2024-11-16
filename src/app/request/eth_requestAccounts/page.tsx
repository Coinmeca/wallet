"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { useMessageHandler, useTelegram } from "hooks";
/*
await window.ethereum.providerMap.get("CoinmecaWallet").request({method: 'eth_requestAccounts'})
*/

export default function Page() {
    const method = "eth_requestAccounts";
    const router = useRouter();

    const { telegram } = useTelegram();
    const { provider, account } = useCoinmecaWalletProvider();
    const { message, params, app, isPopup } = useMessageHandler();

    const [level, setLevel] = useState(0);
    const [error, setError] = useState<any>();

    const handleClose = () => {
        if (level === 0)
            window?.opener?.postMessage(
                {
                    method,
                    error: "User rejected the request",
                },
                "*",
            );
        if (isPopup) {
            if (telegram) telegram?.close();
            window?.close();
        } else router.push("/");
    };

    const handleConnect = async () => {
        await provider
            ?.requestAccounts(app!)
            .then((result) => {
                window?.opener?.postMessage(
                    {
                        method,
                        result,
                    },
                    "*",
                );
                setLevel(1);
            })
            .catch((error) => {
                console.log(error);
                window?.opener?.postMessage(
                    {
                        method,
                        error,
                    },
                    "*",
                );
                setError(error);
                setLevel(2);
            });
    };

    console.log({ message, params, app });

    return app ? (
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
                                                    children: (
                                                        <Layouts.Col gap={0} align={"center"} style={{ height: "100%" }} fill>
                                                            <Layouts.Col gap={4} align={"center"} fit>
                                                                <Elements.Text type={"h3"}>Connect</Elements.Text>
                                                                <Elements.Text size={1} weight={"bold"}>
                                                                    <Elements.Text opacity={0.6}>Connect</Elements.Text>{" "}
                                                                    <Elements.Text>{account?.name}</Elements.Text>{" "}
                                                                    <Elements.Text opacity={0.6}>
                                                                        (
                                                                        {account?.address?.substring(0, account?.address?.startsWith("0x") ? 8 : 6) +
                                                                            "..." +
                                                                            account?.address?.substring(account?.address?.length - 6, account?.address?.length)}
                                                                        ) to
                                                                    </Elements.Text>{" "}
                                                                    <Elements.Text>{app?.name}</Elements.Text>{" "}
                                                                    <Elements.Text opacity={0.6}>
                                                                        ({app?.url}). Please check out the information of app and allow connections only to apps
                                                                        you trust.
                                                                    </Elements.Text>
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
                                                                <Elements.Text type={"h3"}>Approved</Elements.Text>
                                                                <Elements.Text size={1} weight={"bold"}>
                                                                    <Elements.Text opacity={0.6}>Comepete to connect</Elements.Text>{" "}
                                                                    <Elements.Text>{account?.name}</Elements.Text>{" "}
                                                                    <Elements.Text opacity={0.6}>
                                                                        (
                                                                        {account?.address?.substring(0, account?.address?.startsWith("0x") ? 8 : 6) +
                                                                            "..." +
                                                                            account?.address?.substring(account?.address?.length - 6, account?.address?.length)}
                                                                        ) to
                                                                    </Elements.Text>{" "}
                                                                    <Elements.Text>{app?.name}</Elements.Text>{" "}
                                                                    <Elements.Text opacity={0.6}>({app?.url}).</Elements.Text>
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
                                                        <Controls.Button type={"line"} onClick={handleConnect}>
                                                            Approve
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
