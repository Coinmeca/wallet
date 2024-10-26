"use client";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { format } from "@coinmeca/ui/lib/utils";
import { useAccount, useWallet } from "hooks";
import { useEffect, useState } from "react";

export default function Home() {
    const { chain } = useAccount();
    const { provider } = useWallet();

    const [balance, setBalance] = useState(0);

    useEffect(() => {
        (async () => await provider?.balance())().then((balance: any) => {
            setBalance(Number(balance) / (10 ^ (chain?.nativeCurrency.decimals || 1)));
        });
    }, [chain, provider?.address]);

    return (
        <Layouts.Page snap>
            {/* <Layouts.Contents.InnerContent> */}
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
                    <Elements.Text type={"h2"}>
                        {format(balance, "currency", {
                            limit: 10,
                            unit: 12,
                            fix: 3,
                        })}
                    </Elements.Text>
                    <Elements.Text type={"h6"}>{chain?.nativeCurrency.symbol}</Elements.Text>
                </Layouts.Col>
            </Layouts.Col>
            {/* <Layouts.Col fill> */}
            {/* </Layouts.Col> */}
            {/* </Layouts.Contents.InnerContent> */}
            <Layouts.Box padding={[2, "", "", ""]} fit>
                <Layouts.Col gap={0}>
                    <Layouts.Menu
                        menu={[
                            [
                                <>
                                    <Controls.Tab>Token</Controls.Tab>
                                </>,
                                <>
                                    <Controls.Tab>NFT</Controls.Tab>
                                </>,
                                <>
                                    <Controls.Tab>Activity</Controls.Tab>
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
        </Layouts.Page>
    );
}
