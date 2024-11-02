"use client";

import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { useAccount, usePopupChecker, useStorage, useTelegram } from "hooks";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { App } from "types";

/*
http://localhost:3000/request/eth_requestAccounts?appName=MetaMask&appUrl=www.npmjs.com&appLogo=https://static-production.npmjs.com/b0f1a8318363185cc2ea6a40ac23eeb2.png
http://localhost:3000/request/eth_requestAccounts
*/

export default function eth_requestAccounts({ params }: { params: any }) {
    const method = "eth_requestAccounts"
    const router = useRouter();
    const searchParams = useSearchParams();

    const { storage, session } = useStorage();
    const { isPopup } = usePopupChecker();
    const { telegram } = useTelegram();
    const { account } = useAccount();

    const [app, setApp] = useState<App>();
    const [level, setLevel] = useState(0);

    const handleClose = () => {
        if (level === 0) window.opener.postMessage({
            method,
            error: "User rejected the request",
        }, "*");
        if (isPopup) {
            if (telegram) telegram?.close();
            window?.close()
        } else router.push("/");
    };

    const handleConnect = () => {
        const key = session?.get("key");
        let apps = storage?.get(`${key}:apps`)
        let address: string[] = [];

        if (apps) {
            const selectedApp = apps?.find((a: App) => a?.url?.toLowerCase() === app?.url?.toLowerCase());
            if (selectedApp) {
                if (Array.isArray(selectedApp?.address)) {
                    const exist = selectedApp?.address?.find((address: string) => address?.toLowerCase() === account?.address?.toLowerCase())
                    if (!exist) {
                        address = [...selectedApp?.address, account?.address];
                        storage?.set(`${key}`, apps?.map((a: App) => a?.url?.toLowerCase() === selectedApp?.url?.toLowerCase() ? {
                            ...selectedApp,
                            address,
                        } : a));
                    } else {
                        address = selectedApp?.address
                    }
                } else {
                    if (account?.address) address = [account?.address];
                    storage?.set(`${key}`, apps?.map((a: App) => a?.url?.toLowerCase() === selectedApp?.url?.toLowerCase() ? {
                        ...selectedApp,
                        address,
                    } : a));
                }
            } else {
                if (account?.address) address = [account?.address];
                storage?.set(`${key}:apps`, [...apps, {
                    ...app,
                    address,
                }]);
            }
        } else {
            if (account?.address) address = [account?.address];
            storage?.set(`${key}:apps`, [{
                ...app,
                address,
            }]);
        }

        window.opener.postMessage({
            method,
            result: address,
        }, "*");
        setLevel(1);
    }


    useLayoutEffect(() => {
        const url = searchParams.get("appUrl");
        const site = url && decodeURIComponent(url);
        const origin = site && new URL(site.startsWith("http") ? site : `https://${site}`).host;

        const app = {
            name: searchParams.get("appName") || undefined,
            logo: searchParams.get("appLogo") || undefined,
            url: origin || undefined,
        };

        if (app?.name && app?.name !== "" && app?.url && app?.url !== "") setApp(app);
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
                                                    src={level === 0 ? 'https://web3.coinmeca.net/wallets/MetaMask/logo.svg' : require("../../../assets/animation/success.gif")}
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
                                                children:
                                                    <Layouts.Contents.InnerContent scroll={false}>
                                                        <Layouts.Col align={"center"} style={{ flex: 1 }} fill>
                                                            <Layouts.Col gap={4} align={"center"} fit>
                                                                <Elements.Text type={"h2"}>Connect</Elements.Text>
                                                                <Elements.Text size={1} weight={"bold"}>
                                                                    <Elements.Text opacity={0.6}>Connect</Elements.Text>{" "}
                                                                    <Elements.Text>{account?.name}</Elements.Text>{" "}
                                                                    <Elements.Text opacity={0.6}>({account?.address?.substring(0, account?.address?.startsWith("0x") ? 8 : 6) + "..." + account?.address?.substring(account?.address?.length - 6, account?.address?.length)}) to</Elements.Text>{" "}
                                                                    <Elements.Text>{app?.name}</Elements.Text>{" "}
                                                                    <Elements.Text opacity={0.6}>({app?.url}). Please checko out the information of app and allow connections only to apps you trust.</Elements.Text>
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
                                            },
                                            {
                                                active: level === 1,
                                                children:
                                                    <Layouts.Contents.InnerContent scroll={false}>
                                                        <Layouts.Col align={"center"} style={{ flex: 1 }} fill>
                                                            <Layouts.Col gap={4} align={"center"} fit>
                                                                <Elements.Text type={"h2"}>Approved</Elements.Text>
                                                                <Elements.Text size={1} weight={"bold"}>
                                                                    <Elements.Text opacity={0.6}>Comepete to connect</Elements.Text>{" "}
                                                                    <Elements.Text>{account?.name}</Elements.Text>{" "}
                                                                    <Elements.Text opacity={0.6}>({account?.address?.substring(0, account?.address?.startsWith("0x") ? 8 : 6) + "..." + account?.address?.substring(account?.address?.length - 6, account?.address?.length)}) to</Elements.Text>{" "}
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
                                            }
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
