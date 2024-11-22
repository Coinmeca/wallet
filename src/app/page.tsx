"use client";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { useWindowSize } from "@coinmeca/ui/hooks";
import { Root } from "@coinmeca/ui/lib/style";
import { format } from "@coinmeca/ui/lib/utils";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { GetBalance } from "api/account";
import { AnimatePresence } from "framer-motion";
import { usePageLoader } from "hooks";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import Token from "./token/page";
import Activity from "./activity/page";

export default function Main() {
    const path = usePathname();
    const router = useRouter();

    const { windowSize } = useWindowSize();
    const { isLoad } = usePageLoader();
    const { account, chain } = useCoinmecaWalletProvider();
    const { data: balance, isLoading } = GetBalance(chain?.rpcUrls?.[0], account?.address);

    const responsive = useMemo(() => windowSize.width <= Root.Device.Tablet, [windowSize]);

    const tab = useCallback((target:string) => path?.startsWith(`/${target}`),[path])

    return (
        <Layouts.Page snap>
            <AnimatePresence>
                {isLoad && (
                    <>
                        <Layouts.Col
                            align={"center"}
                            style={{
                                scrollSnapAlign: "start",
                                height: "24vh",
                                minHeight: "16em",
                                maxHeight: "32em",
                            }}
                            fill>
                            <Layouts.Col gap={2} style={{ ...(responsive && { padding: "4em 8em" }) }}>
                                <Elements.Text type={"h6"}>Balance</Elements.Text>
                                <Elements.Text type={"h3"}>
                                    {isLoading
                                        ? "~"
                                        : format(balance, "currency", {
                                              unit: 9,
                                              limit: 12,
                                              fix: 9,
                                          })}
                                </Elements.Text>
                                {/* <Elements.Text type={"h6"} opacity={0.6}>
                                    $ 0.00
                                </Elements.Text> */}
                            </Layouts.Col>
                        </Layouts.Col>
                        <Layouts.Box padding={[2, "", "", ""]}>
                            <Layouts.Col gap={0} fill>
                                <Layouts.Menu
                                    menu={[
                                        [
                                            [
                                                <>
                                                    <Controls.Tab active={tab("token")} onClick={() => router.push("/token")}>
                                                        Token
                                                    </Controls.Tab>
                                                </>,
                                                <>
                                                    <Controls.Tab active={tab("nft")} onClick={() => router.push("/nft")}>
                                                        NFT
                                                    </Controls.Tab>
                                                </>,
                                                <>
                                                    <Controls.Tab active={tab("activity")} onClick={() => router.push("/activity")}>
                                                        Activity
                                                    </Controls.Tab>
                                                </>,
                                            ],
                                            [
                                                <>
                                                    <Controls.Input
                                                        left={{
                                                            children: (
                                                                <>
                                                                    <Elements.Icon icon={"search"} />
                                                                </>
                                                            ),
                                                        }}
                                                        fold={false}
                                                    />
                                                </>,
                                            ],
                                        ],
                                    ]}
                                />
                                <Layouts.Contents.TabContainer
                                    style={{ flex: 1 }}
                                    contents={[
                                        {
                                            active: tab("token"),
                                            style: { flex: 1 },
                                            children: (
                                                <Token />
                                            ),
                                        }, {
                                            active: tab("activity"),
                                            style: { flex: 1 },
                                            children: (
                                                <Activity />
                                            ),
                                        },
                                    ]}
                                />
                            </Layouts.Col>
                            <div style={{ position: "fixed", width: "-webkit-fill-available", left: 0, bottom: 0, margin: "2em" }}>
                                <Layouts.Row gap={2} fill>
                                    <Controls.Button type={"solid"} iconLeft={"income"} color={"green"}>
                                        Receive
                                    </Controls.Button>
                                    <Controls.Button type={"solid"} iconRight={"outcome"} color={"red"}>
                                        Send
                                    </Controls.Button>
                                </Layouts.Row>
                            </div>
                        </Layouts.Box>
                    </>
                )}
            </AnimatePresence>
        </Layouts.Page>
    );
}
