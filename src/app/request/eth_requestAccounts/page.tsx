"use client";

import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { usePopupChecker, useStorage, useTelegram, useWallet } from "hooks";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { App } from "types";

/*
await window.ethereum.providerMap.get("CoinmecaWallet").request({method: 'eth_requestAccounts'})
*/

export default function eth_requestAccounts({ params }: { params: any }) {
    const method = "eth_requestAccounts";
    const router = useRouter();

    const { storage } = useStorage();
    const { isPopup } = usePopupChecker();
    const { telegram } = useTelegram();
    const { account } = useWallet();

    const [app, setApp] = useState<App>();
    const [level, setLevel] = useState(0);

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

    const handleConnect = () => {
        const apps = storage?.get("apps");
        const url = app?.url?.toLowerCase();
        let address = [];

        if (apps) {
            const exist = apps?.find((a: string) => a.toLowerCase() === url);
            if (exist) {
                const info = storage?.get(`app:${url}`);
                if (info) {
                    address = [account?.address, ...info?.address?.filter((a: string) => a?.toLowerCase() !== account?.address?.toLowerCase())].filter(
                        (a) => a,
                    );
                    storage?.set(`app:${url}`, { ...info, address });
                } else {
                    address = [account?.address].filter((a) => a);
                    storage?.set(`app:${url}`, { address });
                }
            } else {
                address = [account?.address].filter((a) => a);
                storage?.set("apps", [...apps, url]);
                storage?.set(`app:${url}`, { address });
            }
        } else {
            address = [account?.address].filter((a) => a);
            storage?.set("apps", [url]);
            storage?.set(`app:${url}`, { address });
        }

        window?.opener?.postMessage(
            {
                method,
                result: address,
            },
            "*",
        );

        setLevel(1);
    };

    useLayoutEffect(() => {
        if ((window as any)?.coinmeca) {
            const params = (window as any)?.coinmeca?.params;
            if (params) {
                const url = params?.appUrl || params?.url;
                const site = url && decodeURIComponent(url);
                const origin = site && new URL(site.startsWith("http") ? site : `https://${site}`).host;
                const app = {
                    name: params?.appName || params?.name || undefined,
                    logo: params?.appLogo || params?.logo || params?.appIcon || params?.icon || undefined,
                    url: origin || undefined,
                };
                if (app?.name && app?.name !== "" && app?.url && app?.url !== "") setApp(app);
            }
        }
    }, []);

    return app ? (
        <Layouts.Contents.SlideContainer
            contents={[
                {
                    active: true,
                    children: (
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
                                                    src={level === 0 ? app?.logo || "" : require("../../../assets/animation/success.gif")}
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
                                </Layouts.Col>
                                <Layouts.Col gap={0} align={"center"} style={{ flex: 1 }} fill>
                                    <Layouts.Contents.SlideContainer
                                        contents={[
                                            {
                                                active: level === 0,
                                                children: (
                                                    <Layouts.Contents.InnerContent scroll={false}>
                                                        <Layouts.Col align={"center"} style={{ flex: 1 }} fill>
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
                                                        <Layouts.Row gap={2}>
                                                            <Controls.Button type={"glass"} onClick={handleClose}>
                                                                Cancel
                                                            </Controls.Button>
                                                            <Controls.Button type={"line"} onClick={handleConnect}>
                                                                Approve
                                                            </Controls.Button>
                                                        </Layouts.Row>
                                                    </Layouts.Contents.InnerContent>
                                                ),
                                            },
                                            {
                                                active: level === 1,
                                                children: (
                                                    <Layouts.Contents.InnerContent scroll={false}>
                                                        <Layouts.Col align={"center"} style={{ flex: 1 }} fill>
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
                                                        <Layouts.Row gap={2}>
                                                            <Controls.Button type={"glass"} onClick={handleClose}>
                                                                Close
                                                            </Controls.Button>
                                                        </Layouts.Row>
                                                    </Layouts.Contents.InnerContent>
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
                                The given app information is something wrong. Couldn't found the information of requested app.
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
