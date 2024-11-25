"use client";

import Image from "next/image";
import { useState } from "react";

import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { useMessageHandler, useTelegram } from "hooks";
import { GetErc20 } from "api/erc20";
import { short } from "utils";

/*
await adapter?.request({
                method,
                params: {
                    type: "ERC20",
                    options: {
                        address: "0xb60e8dd61c5d32be8058bb8eb970870f07233155",
                        symbol: "FOO",
                        decimals: 18,
                        image: "https://foo.io/token-image.svg",
                    },
                },
            })
*/

const method = "wallet_watchAsset";
const timeout = 5000;

export default function Page() {
    const { telegram } = useTelegram();
    const { provider, account, chain } = useCoinmecaWalletProvider();
    const { params, messageId } = useMessageHandler();

    const [level, setLevel] = useState(0);
    const [error, setError] = useState<any>();

    const [result] = GetErc20(chain?.rpcUrls?.[0], params?.options?.address, account?.address);
    const asset = result?.[params?.options?.address];

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

    const handleAddAsset = async () => {
        if (asset?.data?.address && provider?.addFungibleAsset(asset?.data?.address)) {
            window?.opener?.postMessage(
                {
                    method,
                    result: true,
                    id: messageId,
                },
                "*",
            );
            setLevel(1);
            setTimeout(handleClose, timeout);
        } else {
            const error = "Asset data is something wrong.";
            console.log(error);
            window?.opener?.postMessage(
                {
                    method,
                    error,
                    id: messageId,
                },
                "*",
            );
            setError(error);
        }
    };

    return params ? (
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
                                                            level === 0 && asset?.data?.address && !error
                                                                ? `https://web3.coinmeca.net/${chain?.chainId}/${asset?.data?.address?.toLowerCase()}/logo.svg`
                                                                : require(`../../../assets/animation/${
                                                                      typeof asset !== "object" ? "loading" : level === 1 ? "success" : "failure"
                                                                  }.gif`)
                                                        }
                                                        alt={asset?.data?.symbol || "Unknown"}
                                                        style={{ width: "8em", height: "8em" }}
                                                    />
                                                </div>
                                                <Layouts.Col gap={1}>
                                                    <Elements.Text type={"h4"}>{asset?.data?.symbol || ""}</Elements.Text>
                                                    <Elements.Text type={"h6"}>{asset?.data?.name}</Elements.Text>
                                                    <Elements.Text type={"strong"} opacity={0.6}>
                                                        {short(asset?.data?.address)}
                                                    </Elements.Text>
                                                </Layouts.Col>
                                            </Layouts.Col>
                                        </Layouts.Col>
                                        {/* <Layouts.Col gap={8} align={"center"} style={{ flex: 1 }} fill> */}
                                        <Layouts.Contents.SlideContainer
                                            style={{ flex: 1 }}
                                            contents={[
                                                {
                                                    active: !asset,
                                                    children: (
                                                        <Layouts.Col gap={0} align={"center"} style={{ height: "100%" }} fill>
                                                            <Layouts.Col gap={4} align={"center"} fit>
                                                                <Elements.Text opacity={0.6}>Loading...</Elements.Text>
                                                            </Layouts.Col>
                                                        </Layouts.Col>
                                                    ),
                                                },
                                                {
                                                    active: level === 0 && asset?.isSuccess,
                                                    children: (
                                                        <Layouts.Col gap={0} align={"center"} style={{ height: "100%" }} fill>
                                                            <Layouts.Col gap={4} align={"center"} fit>
                                                                <Elements.Text type={"h3"}>Add {asset?.data?.symbol}</Elements.Text>
                                                                <Elements.Text size={1} weight={"bold"}>
                                                                    <Elements.Text opacity={0.6}>Add</Elements.Text>{" "}
                                                                    <Elements.Text>{asset?.data?.symbol}</Elements.Text>{" "}
                                                                    <Elements.Text opacity={0.6}>
                                                                        ({short(asset?.data?.address)}) to the asset list of{" "}
                                                                    </Elements.Text>{" "}
                                                                    <Elements.Text>{account?.name}</Elements.Text>{" "}
                                                                    <Elements.Text opacity={0.6}>({short(account?.address)}).</Elements.Text>
                                                                </Elements.Text>
                                                            </Layouts.Col>
                                                        </Layouts.Col>
                                                    ),
                                                },
                                                {
                                                    active: level === 0 && (asset?.isError || error),
                                                    children: (
                                                        <Layouts.Col gap={0} align={"center"} style={{ height: "100%" }} fill>
                                                            <Layouts.Col gap={4} align={"center"} fit>
                                                                <Elements.Text type={"h3"}>Failure</Elements.Text>
                                                                <Elements.Text weight={"bold"} opacity={0.6}>
                                                                    {asset?.error?.message || asset?.error}
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
                                                                <Elements.Text type={"h3"}>Complete</Elements.Text>
                                                                <Elements.Text size={1} weight={"bold"}>
                                                                    <Elements.Text opacity={0.6}>Successfully added </Elements.Text>
                                                                    <Elements.Text>{asset?.data?.symbol}</Elements.Text>{" "}
                                                                    <Elements.Text opacity={0.6}>
                                                                        ({short(asset?.data?.address)}) to the asset list.
                                                                    </Elements.Text>{" "}
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
                                                active: !asset,
                                                children: <></>,
                                            },
                                            {
                                                active: level === 0 && asset?.isSuccess,
                                                children: (
                                                    <Layouts.Row gap={2}>
                                                        <Controls.Button type={"glass"} onClick={handleClose}>
                                                            Cancel
                                                        </Controls.Button>
                                                        <Controls.Button type={"line"} onClick={handleAddAsset}>
                                                            Add Asset
                                                        </Controls.Button>
                                                    </Layouts.Row>
                                                ),
                                            },
                                            {
                                                active: level === 1 || asset?.isError,
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
