"use client";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { format } from "@coinmeca/ui/lib/utils";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider";
import { GetBalance } from "api/account";
import { Lists } from "containers";
import { AnimatePresence } from "framer-motion";
import { usePageLoader } from "hooks";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
    const path = usePathname();
    const router = useRouter();

    const { isLoad } = usePageLoader();
    const { account, chain } = useCoinmecaWalletProvider();
    const { data: balance, isLoading } = GetBalance(chain?.rpcUrls?.[0], account?.address);

    const [tab, setTab] = useState("token");

    useEffect(() => {
        // fixme:
        if (path.startsWith("/")) setTab("token");
        if (path.startsWith("/token")) setTab("token");
        if (path.startsWith("/nft")) setTab("nft");
    }, [path]);

    return (
        <Layouts.Page snap>
            <AnimatePresence>
                {isLoad && (
                    <>
                        <Layouts.Col
                            align="center"
                            style={{
                                scrollSnapAlign: "start",
                                height: "24vh",
                                minHeight: "16em",
                                maxHeight: "32em",
                            }}
                            fill>
                            <Layouts.Col gap={2}>
                                <Elements.Text type={"h3"}>
                                    {isLoading
                                        ? "~"
                                        : format(balance, "currency", {
                                              unit: 9,
                                              limit: 12,
                                              fix: 9,
                                          })}
                                </Elements.Text>
                                <Elements.Text type={"h6"}>{chain?.nativeCurrency?.symbol}</Elements.Text>
                            </Layouts.Col>
                        </Layouts.Col>
                        <Layouts.Box padding={[2, "", "", ""]} fit>
                            <Layouts.Col gap={0}>
                                <Layouts.Menu
                                    menu={[
                                        [
                                            [
                                                <>
                                                    <Controls.Tab active={tab === "token"} onClick={() => router.push("/token")}>
                                                        Token
                                                    </Controls.Tab>
                                                </>,
                                                <>
                                                    <Controls.Tab active={tab === "nft"} onClick={() => router.push("/nft")}>
                                                        NFT
                                                    </Controls.Tab>
                                                </>,
                                                <>
                                                    <Controls.Tab active={tab === "activity"} onClick={() => router.push("/activity")}>
                                                        Activity
                                                    </Controls.Tab>
                                                </>,
                                            ],
                                            [
                                                <>
                                                    <Controls.Input left={{ children: <Elements.Icon icon={"search"} /> }} fold />
                                                </>,
                                            ],
                                        ],
                                    ]}
                                />
                            </Layouts.Col>
                            <Layouts.Contents.InnerContent scroll={false}>
                                <Layouts.Contents.TabContainer
                                    contents={[
                                        {
                                            active: tab === "token",
                                            children: <Lists.Fungibles />,
                                        },
                                    ]}
                                />
                            </Layouts.Contents.InnerContent>
                            <div style={{ position: "fixed", width: "-webkit-fill-available", left: 0, bottom: 0, margin: "2em" }}>
                                <Layouts.Row gap={2} fill>
                                    <Controls.Button type={"solid"} icon={"chevron-left-bold"} color={"green"}>
                                        Receive
                                    </Controls.Button>
                                    <Controls.Button type={"solid"} icon={"chevron-right-bold"} color={"red"}>
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
