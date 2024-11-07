"use client";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { format } from "@coinmeca/ui/lib/utils";
import { useCoinmecaWallet } from "@coinmeca/wallet-sdk/context";
import { AnimatePresence } from "framer-motion";
import { usePageLoader } from "hooks";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
    const path = usePathname();
    const router = useRouter();

    const { isLoad } = usePageLoader();

    const { provider, account, chain } = useCoinmecaWallet();

    const [balance, setBalance] = useState(0);
    const [tab, setTab] = useState("token");

    useEffect(() => {
        (async () => await provider?.balance())().then((balance: any) => {
            setBalance(Number(balance) / (10 ^ (chain?.nativeCurrency.decimals || 1)));
        });
    }, [chain, account]);

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
                                    {format(balance, "currency", {
                                        limit: 10,
                                        unit: 12,
                                        fix: 3,
                                    })}
                                </Elements.Text>
                                <Elements.Text type={"h6"}>{chain?.nativeCurrency.symbol}</Elements.Text>
                            </Layouts.Col>
                        </Layouts.Col>
                        <Layouts.Box padding={[2, "", "", ""]} fit>
                            <Layouts.Col gap={0}>
                                <Layouts.Menu
                                    menu={[
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
                                    ]}
                                />
                            </Layouts.Col>
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
