"use client";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { usePortal } from "@coinmeca/ui/hooks";
import { format } from "@coinmeca/ui/lib/utils";
import { Asset } from "@coinmeca/ui/types";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-sdk/contexts";
import { GetBalance } from "api/account";
import { GetErc20 } from "api/erc20";
import { Modals } from "containers";
import { AnimatePresence } from "framer-motion";
import { usePageLoader } from "hooks";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function Home() {
    const path = usePathname();
    const router = useRouter();

    const { isLoad } = usePageLoader();
    const { account, chain, tokens } = useCoinmecaWalletProvider();
    const { data: balance, isLoading } = GetBalance(chain?.rpcUrls?.[0], account?.address);

    const [tab, setTab] = useState("token");

    useEffect(() => {
        // fixme:
        if (path.startsWith("/")) setTab("token");
        if (path.startsWith("/token")) setTab("token");
        if (path.startsWith("/nft")) setTab("nft");
    }, [path]);

    const [showAddFungible, closeAddFungible] = usePortal(() => <Modals.Add.Fungible onClose={closeAddFungible} />);

    const fungibles = GetErc20(chain?.rpcUrls?.[0], tokens?.fungibles, account?.address);
    const fungiblesList = useCallback(
        (tokens?: Asset[]) => {
            return [
                ...(tokens || [])
                    ?.map(
                        (t?: Asset) =>
                            typeof t === "object" && {
                                style: { padding: "1.5em" },
                                children: [[
                                    {
                                        gap: 1.5,
                                        children: [
                                            {
                                                fit:true,
                                                children: (<>
                                                    <Elements.Avatar size={4} img={`https://web3.coinmeca.net/${chain?.chainId}/${t?.address}/logo.svg`} />
                                                </>),
                                            },
                                            [[
                                                [[
                                                    {
                                                        gap:0,
                                                        children: [
                                                            <>
                                                                <Elements.Text height={0}>{t?.symbol}</Elements.Text>
                                                            </>,
                                                            <>
                                                                <Elements.Text height={0} opacity={0.6}>{t?.name}</Elements.Text>
                                                            </>,
                                                        ]
                                                    },
                                                ]],
                                                [
                                                    {
                                                        align:'right',
                                                        children:<>
                                                        <Elements.Text>{format(t?.balance || 0, "currency", {
                                                                                                  unit: 9,
                                                                                                  limit: 12,
                                                                                                  fix: 9,
                                                                                              })}</Elements.Text>
                                                    </>},
                                                ]
                                            ]],
                                        ]
                                    }
                                ]]
                            },
                    )
                    ?.filter((a) => a),
                {
                    onClick: showAddFungible,
                    style: { padding: "1.75em 1.5em" },
                    children: [
                        [
                            {
                                gap: 1.5,
                                children: [
                                    {
                                        fit: true,
                                        children: (
                                            <Elements.Icon
                                                scale={0.75}
                                                icon={"plus-bold"}
                                                style={{ padding: "0.5em", borderRadius: "100%", border: "0.1em solid rgb(var(--white))" }}
                                            />
                                        ),
                                    },
                                    <>
                                        <Elements.Text>Add Fungible Token</Elements.Text>
                                    </>,
                                ],
                            },
                        ],
                    ],
                },
            ];
        },
        [tokens?.fungibles, fungibles],
    );

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
                                                    <Controls.Tab active={tab === "activity"} onClick={() => router.push("/activity")} iconLeft={"search"} />
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
                                            children: <Layouts.List list={Object.values(fungibles?.data || [{}])} formatter={fungiblesList} />,
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
