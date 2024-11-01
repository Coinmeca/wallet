"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { usePopupChecker, useTelegram } from "hooks";
import { App } from "types";

/*
http://localhost:3000/request/eth_requestAccounts?appName=MetaMask&appUrl=www.npmjs.com&appLogo=https://static-production.npmjs.com/b0f1a8318363185cc2ea6a40ac23eeb2.png
*/

export default function eth_requestAccounts({ params }: { params: any }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const { telegram } = useTelegram();
    const { isPopup } = usePopupChecker();

    const [app, setApp] = useState<App>();
    const [level, setLevel] = useState(0);

    useLayoutEffect(() => {
        const app = {
            name: searchParams.get("appName") || undefined,
            url: searchParams.get("appUrl") || undefined,
            logo: searchParams.get("appLogo") || undefined,
        };

        const { name, url } = app;
        if (name && name !== "" && url) setApp(app);
    }, []);

    const handleClose = () => {
        if (telegram) telegram?.close();
        else if (isPopup) window?.close();
        else router.push("/");
    };

    return app ? (
        <Layouts.Contents.SlideContainer
            contents={[
                {
                    active: level === 0,
                    children: (
                        <Layouts.Contents.InnerContent scroll={false}>
                            <Layouts.Col align={"center"} style={{ padding: "2em" }} fill>
                                <Layouts.Col gap={4} align={"center"} style={{ padding: "2em" }} fill>
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
                                                {/* <Image
                                                    src={`/api/image`}
                                                    alt="Dynamic Image"
                                                    width={0}
                                                    height={0}
                                                    loader={({ src }) => {
                                                        if (app.logo && app.logo !== "")
                                                            return fetch("/api/image", {
                                                                method: "POST",
                                                                body: JSON.stringify({ url: app.logo || "" }),
                                                                headers: { "Content-Type": "application/json" },
                                                            }).then((res) => res.url);
                                                        else return "";
                                                    }}
                                                /> */}
                                                <Image
                                                    width={0}
                                                    height={0}
                                                    src={app.logo || ""}
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
                                    <Layouts.Box
                                        style={{
                                            "--white": "255,255,255",
                                            "--black": "0, 0, 0",
                                            background: "rgba(var(--white),.15)",
                                            maxHeight: "max-content",
                                            padding: "clamp(2em, 7.5%, 4em)",
                                        }}
                                        fit>
                                        {/* <Layouts.Col gap={2} align={"left"}>
                                            <Layouts.Col gap={0.5}>
                                                <Elements.Text size={1.25} opacity={0.6}>
                                                    Chain RPC URLs
                                                </Elements.Text>
                                                <Elements.Text>{newChain.rpcUrls[0]}</Elements.Text>
                                            </Layouts.Col>
                                            <Layouts.Col gap={0.5}>
                                                <Elements.Text size={1.25} opacity={0.6}>
                                                    Native Currency Name
                                                </Elements.Text>
                                                <Elements.Text>{newChain.nativeCurrency.name}</Elements.Text>
                                            </Layouts.Col>
                                            <Layouts.Col gap={0.5}>
                                                <Elements.Text size={1.25} opacity={0.6}>
                                                    Native Currency Symbol
                                                </Elements.Text>
                                                <Elements.Text>{newChain.nativeCurrency.symbol}</Elements.Text>
                                            </Layouts.Col>
                                            <Layouts.Col gap={0.5}>
                                                <Elements.Text size={1.25} opacity={0.6}>
                                                    Currency Decimals
                                                </Elements.Text>
                                                <Elements.Text>{newChain.nativeCurrency.decimals}</Elements.Text>
                                            </Layouts.Col>
                                        </Layouts.Col> */}
                                    </Layouts.Box>
                                </Layouts.Col>
                                <Layouts.Col gap={4} align={"center"} style={{ margin: 0 }}>
                                    <Layouts.Row gap={2}>
                                        <Controls.Button onClick={handleClose}>Cancel</Controls.Button>
                                        <Controls.Button type={"line"}>Approve</Controls.Button>
                                    </Layouts.Row>
                                </Layouts.Col>
                            </Layouts.Col>
                        </Layouts.Contents.InnerContent>
                    ),
                },
                // {
                //     active: level === 1,
                //     children: (
                //         <Layouts.Contents.InnerContent scroll={false}>
                //             <Layouts.Col align={"center"} style={{ padding: "4em" }} fill>
                //                 <Layouts.Col align={"center"} style={{ flex: 1 }}>
                //                     <Layouts.Col gap={6} fit>
                //                         <Layouts.Row gap={3} align={"center"} fix>
                //                             <div
                //                                 style={{
                //                                     display: "flex",
                //                                     alignItems: "center",
                //                                     justifyContent: "center",
                //                                     maxWidth: "max-content",
                //                                     maxHeight: "max-content",
                //                                     padding: "2em",
                //                                     borderRadius: "100%",
                //                                     background: "rgba(var(--white),.15)",
                //                                 }}>
                //                                 <Image
                //                                     src={`https://web3.coinmeca.net/${chain?.id}/logo.svg`}
                //                                     width={0}
                //                                     height={0}
                //                                     alt={newChain.chainName || ""}
                //                                     style={{ width: "4em", height: "4em" }}
                //                                 />
                //                             </div>
                //                             <Layouts.Col gap={0} align={"center"} fill>
                //                                 <Elements.Text type={"h6"} height={0} align={"left"}>
                //                                     {chain?.name}
                //                                 </Elements.Text>
                //                                 <Elements.Text type={"strong"} height={0} align={"left"} opacity={0.6}>
                //                                     {chain?.id}
                //                                 </Elements.Text>
                //                             </Layouts.Col>
                //                         </Layouts.Row>
                //                         <Layouts.Divider>
                //                             <Elements.Icon icon={"chevron-down"} />
                //                         </Layouts.Divider>
                //                         <Layouts.Row gap={3} align={"center"} fix>
                //                             <div
                //                                 style={{
                //                                     display: "flex",
                //                                     alignItems: "center",
                //                                     justifyContent: "center",
                //                                     maxWidth: "max-content",
                //                                     maxHeight: "max-content",
                //                                     padding: "2em",
                //                                     borderRadius: "100%",
                //                                     background: "rgba(var(--white),.15)",
                //                                 }}>
                //                                 <Image
                //                                     src={`https://web3.coinmeca.net/${newChain?.chainId}/logo.svg`}
                //                                     width={0}
                //                                     height={0}
                //                                     alt={newChain.chainName || ""}
                //                                     style={{ width: "4em", height: "4em" }}
                //                                 />
                //                             </div>
                //                             <Layouts.Col gap={0} align={"center"}>
                //                                 <Elements.Text type={"h6"} height={0} align={"left"}>
                //                                     {newChain?.chainName}
                //                                 </Elements.Text>
                //                                 <Elements.Text type={"strong"} height={0} align={"left"} opacity={0.6}>
                //                                     {newChain?.chainId}
                //                                 </Elements.Text>
                //                             </Layouts.Col>
                //                         </Layouts.Row>
                //                     </Layouts.Col>
                //                 </Layouts.Col>
                //                 <Layouts.Col gap={0} align={"center"} style={{ flex: 1 }} fill>
                //                     <Layouts.Col align={"center"} style={{ padding: "4em" }}>
                //                         <Layouts.Col gap={4} align={"center"} fit>
                //                             <Elements.Text type={"h2"}>Switch</Elements.Text>
                //                             <Elements.Text weight={"bold"} opacity={0.6}>
                //                                 Please enter a private key of the wallet that be imported.
                //                             </Elements.Text>
                //                         </Layouts.Col>
                //                     </Layouts.Col>
                //                     <Layouts.Col gap={4} align={"center"} style={{ margin: 0 }} fit>
                //                         <Layouts.Row gap={2}>
                //                             <Controls.Button type={"glass"} onClick={handleClose}>
                //                                 Close
                //                             </Controls.Button>
                //                             <Controls.Button type={"line"} onClick={handleSwitchChain}>
                //                                 Switch Chain
                //                             </Controls.Button>
                //                         </Layouts.Row>
                //                     </Layouts.Col>
                //                 </Layouts.Col>
                //             </Layouts.Col>
                //         </Layouts.Contents.InnerContent>
                //     ),
                // },
                // {
                //     active: level === 2,
                //     children: (
                //         <Layouts.Contents.InnerContent scroll={false}>
                //             <Layouts.Col align={"center"} style={{ padding: "4em" }} fill>
                //                 <Layouts.Col align={"center"} style={{ flex: 1 }}>
                //                     <Layouts.Col fit>
                //                         <Layouts.Col gap={8} align={"center"} fit>
                //                             <div
                //                                 style={{
                //                                     display: "flex",
                //                                     alignItems: "center",
                //                                     justifyContent: "center",
                //                                     maxWidth: "max-content",
                //                                     maxHeight: "max-content",
                //                                     padding: "1em",
                //                                     borderRadius: "100%",
                //                                     background: "rgba(var(--white),.15)",
                //                                 }}>
                //                                 <Image
                //                                     src={require("../../../assets/animation/success.gif")}
                //                                     width={0}
                //                                     height={0}
                //                                     alt={newChain.chainName || ""}
                //                                     style={{ width: "12em", height: "12em" }}
                //                                 />
                //                             </div>
                //                             <Layouts.Col gap={0} align={"center"}>
                //                                 <Elements.Text type={"h6"} height={0}>
                //                                     {newChain?.chainName}
                //                                 </Elements.Text>
                //                                 <Elements.Text type={"strong"} height={0} opacity={0.6}>
                //                                     {newChain?.chainId}
                //                                 </Elements.Text>
                //                             </Layouts.Col>
                //                         </Layouts.Col>
                //                     </Layouts.Col>
                //                 </Layouts.Col>
                //                 <Layouts.Col gap={0} align={"center"} style={{ flex: 1 }} fill>
                //                     <Layouts.Col align={"center"} style={{ padding: "4em" }}>
                //                         <Layouts.Col gap={4} align={"center"} fit>
                //                             <Elements.Text type={"h2"}>Approved</Elements.Text>
                //                             <Elements.Text size={1} weight={"bold"}>
                //                                 <Elements.Text opacity={0.6}>Switch chain from</Elements.Text>
                //                                 <Elements.Text>{` ${chain?.name}`}</Elements.Text>
                //                                 <Elements.Text opacity={0.6}>to</Elements.Text>
                //                                 <Elements.Text>{` ${newChain?.chainName}`}</Elements.Text>
                //                                 <Elements.Text opacity={0.6}>.</Elements.Text>
                //                             </Elements.Text>
                //                         </Layouts.Col>
                //                     </Layouts.Col>
                //                     <Layouts.Col gap={4} align={"center"} style={{ margin: 0 }} fit>
                //                         <Controls.Button type={"glass"} onClick={handleClose}>
                //                             Close
                //                         </Controls.Button>
                //                     </Layouts.Col>
                //                 </Layouts.Col>
                //             </Layouts.Col>
                //         </Layouts.Contents.InnerContent>
                //     ),
                // },
            ]}
        />
    ) : (
        <>Chain information is something wrong.</>
    );
}
