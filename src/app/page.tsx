"use client";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { useWindowSize } from "@coinmeca/ui/hooks";
import { Parts } from "@coinmeca/ui/index";
import { Root } from "@coinmeca/ui/lib/style";
import { format, parseNumber } from "@coinmeca/ui/lib/utils";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { Account } from "@coinmeca/wallet-sdk/types";
import { useQueries } from "@tanstack/react-query";
import { GetBalance } from "api/account";
import { GetMaxFeePerGas } from "api/onchain";
import { query } from "api/onchain/query";
import { Stages } from "containers";
import { Activity, Nft, Token } from "containers/pages";
import { AnimatePresence } from "framer-motion";
import { usePageLoader } from "hooks";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { Asset } from "types";
import { sanitizeBigIntToHex, short } from "utils";

export default function Main() {
    const width = 64;
    const path = usePathname();
    const router = useRouter();

    const { windowSize } = useWindowSize();
    const { isLoad } = usePageLoader();
    const { chain, account, accounts, contact } = useCoinmecaWalletProvider();
    const { data: balance, isLoading } = GetBalance(chain?.rpcUrls?.[0], account?.address);
    const [searchFilter, setSearchFilter] = useState("");

    const responsive = useMemo(() => windowSize.width <= Root.Device.Tablet, [windowSize]);
    const tab = useCallback((target: string) => path?.startsWith(`/${target}`), [path]);

    const [asset, setAsest] = useState<Asset & { type: "ft" | "nft" }>();

    const [amount, setAmount] = useState<string | number>();
    const [level, setLevel] = useState(0);

    const condition = useMemo(() => amount && parseNumber(amount) > 10 ** -(asset?.decimals || 1), [amount]);
    const fontSize = useMemo(() => {
        const size = (100 / (amount?.toString().length || 1)) * 1.5;
        return `${size > 8 ? 8 : size < 4 ? 4 : size}vw`;
    }, [amount]);

    const handleCancel = () => {
        setAmount("");
        setAsest(undefined);
        setLevel(0);
    };

    const handleConfirmAmount = () => {
        setLevel(1);
    };

    const handleConfirmRecipient = () => {
        setLevel(2);
    };

    const handleTransfer = () => {
        setAmount("");
        setLevel(3);
    };

    return (
        <Layouts.Page snap>
            <AnimatePresence>
                {isLoad && (
                    <Layouts.Contents.SlideContainer
                        offset={level > 2 ? 0 : undefined}
                        contents={[
                            {
                                active: level === 0,
                                children: (
                                    <Layouts.Contents.SlideContainer
                                        contents={[
                                            {
                                                active: true,
                                                children: (
                                                    <>
                                                        <Layouts.Col
                                                            style={{
                                                                scrollSnapAlign: "start",
                                                                height: asset ? "50%" : "24vh",
                                                                minHeight: "16em",
                                                                maxHeight: asset ? "50%" : "32em",
                                                                transition: ".3s ease",
                                                            }}
                                                            fill>
                                                            <Layouts.Contents.SlideContainer
                                                                vertical
                                                                contents={[
                                                                    {
                                                                        active: !!asset,
                                                                        style: {
                                                                            display: "flex",
                                                                            height: "-webkit-fill-available",
                                                                            alignItems: "flex-start",
                                                                            justifyContent: "center",
                                                                        },
                                                                        children: (
                                                                            <Layouts.Col
                                                                                gap={2}
                                                                                align={"center"}
                                                                                style={{ ...(responsive && { padding: "4em 8em" }), maxHeight: "32em" }}
                                                                                fill>
                                                                                <Layouts.Col align={"center"} fit>
                                                                                    <Layouts.Row gap={0.5} fit>
                                                                                        <Elements.Avatar
                                                                                            size={2}
                                                                                            img={`https://web3.coinmeca.net/${
                                                                                                chain?.chainId
                                                                                            }/${asset?.address?.toLowerCase()}/logo.svg`}
                                                                                        />
                                                                                        <Elements.Text type={"h6"}>{asset?.symbol}</Elements.Text>
                                                                                    </Layouts.Row>
                                                                                    <Layouts.Col gap={0}>
                                                                                        <Elements.Text
                                                                                            style={{
                                                                                                fontSize,
                                                                                            }}
                                                                                            opacity={amount?.toString()?.length || 0.6}>
                                                                                            {format(
                                                                                                amount || 0,
                                                                                                "currency",
                                                                                                // !isNaN(Number(amount)) &&
                                                                                                //     Number(amount) > 0 && {
                                                                                                //         unit: 4,
                                                                                                //         fix: 9,
                                                                                                //     },
                                                                                            )}
                                                                                        </Elements.Text>
                                                                                        <Controls.Button onClick={() => setAmount(asset?.balance)}>
                                                                                            {(asset?.balance || 0) <= parseNumber(amount || 0) ? (
                                                                                                "MAX"
                                                                                            ) : (
                                                                                                <>
                                                                                                    {format(asset?.balance, "currency", {
                                                                                                        unit: 9,
                                                                                                        limit: 12,
                                                                                                        fix: 9,
                                                                                                    })}{" "}
                                                                                                    {asset?.symbol}
                                                                                                </>
                                                                                            )}
                                                                                            {/* </Elements.Text> */}
                                                                                        </Controls.Button>
                                                                                    </Layouts.Col>
                                                                                </Layouts.Col>
                                                                            </Layouts.Col>
                                                                        ),
                                                                    },
                                                                    {
                                                                        active: !asset,
                                                                        style: {
                                                                            display: "flex",
                                                                            height: "-webkit-fill-available",
                                                                            alignItems: "center",
                                                                            justifyContent: "center",
                                                                        },
                                                                        children: (
                                                                            <Layouts.Col
                                                                                gap={2}
                                                                                align={"center"}
                                                                                style={{ ...(responsive && { padding: "4em 8em" }), maxHeight: "32em" }}
                                                                                fill>
                                                                                <Layouts.Col>
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
                                                                        ),
                                                                    },
                                                                ]}
                                                            />
                                                        </Layouts.Col>
                                                        <Layouts.Contents.InnerContent
                                                            style={{ scrollSnapAlign: "start", maxHeight: asset ? "50%" : "100%" }}
                                                            scroll={false}>
                                                            <Layouts.Contents.TabContainer
                                                                contents={[
                                                                    {
                                                                        active: !asset,
                                                                        children: (
                                                                            <Layouts.Contents.SlideContainer
                                                                                vertical
                                                                                offset={100}
                                                                                style={{ position: "absolute", width: "100%", height: "100%" }}
                                                                                contents={[
                                                                                    {
                                                                                        active: !!asset,
                                                                                        children: <></>,
                                                                                    },
                                                                                    {
                                                                                        active: !asset,
                                                                                        children: (
                                                                                            <Layouts.Box
                                                                                                padding={
                                                                                                    windowSize.width >= Root.Device.Desktop
                                                                                                        ? [2, 8, 4]
                                                                                                        : windowSize.width >= Root.Device.Mobile
                                                                                                        ? [2, 4, 4]
                                                                                                        : [1, 2, 2]
                                                                                                }
                                                                                                fit>
                                                                                                <Layouts.Contents.InnerContent>
                                                                                                    <Layouts.Col gap={0} fill>
                                                                                                        <Layouts.Menu
                                                                                                            style={{ position: "relative" }}
                                                                                                            menu={[
                                                                                                                {
                                                                                                                    style: { padding: "1em 0" },
                                                                                                                    children: [
                                                                                                                        [
                                                                                                                            <>
                                                                                                                                <Controls.Tab
                                                                                                                                    active={
                                                                                                                                        path === "/" ||
                                                                                                                                        tab("token")
                                                                                                                                    }
                                                                                                                                    onClick={() =>
                                                                                                                                        router.push("/token")
                                                                                                                                    }>
                                                                                                                                    Token
                                                                                                                                </Controls.Tab>
                                                                                                                            </>,
                                                                                                                            <>
                                                                                                                                <Controls.Tab
                                                                                                                                    active={tab("nft")}
                                                                                                                                    onClick={() =>
                                                                                                                                        router.push("/nft")
                                                                                                                                    }>
                                                                                                                                    NFT
                                                                                                                                </Controls.Tab>
                                                                                                                            </>,
                                                                                                                            <>
                                                                                                                                <Controls.Tab
                                                                                                                                    active={tab("activity")}
                                                                                                                                    onClick={() =>
                                                                                                                                        router.push("/activity")
                                                                                                                                    }>
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
                                                                                                                                                <Elements.Icon
                                                                                                                                                    icon={
                                                                                                                                                        "search"
                                                                                                                                                    }
                                                                                                                                                />
                                                                                                                                            </>
                                                                                                                                        ),
                                                                                                                                    }}
                                                                                                                                    onChange={(
                                                                                                                                        e: any,
                                                                                                                                        v: any,
                                                                                                                                    ) => setSearchFilter(v)}
                                                                                                                                    fold={responsive}
                                                                                                                                    clearable
                                                                                                                                />
                                                                                                                            </>,
                                                                                                                        ],
                                                                                                                    ],
                                                                                                                },
                                                                                                            ]}
                                                                                                        />
                                                                                                        <Layouts.Contents.TabContainer
                                                                                                            style={{ flex: 1 }}
                                                                                                            contents={[
                                                                                                                {
                                                                                                                    active: path === "/" || tab("token"),
                                                                                                                    style: { flex: 1 },
                                                                                                                    children: (
                                                                                                                        <Token
                                                                                                                            filter={searchFilter}
                                                                                                                            onSelect={(a: Asset) =>
                                                                                                                                setAsest({ ...a, type: "ft" })
                                                                                                                            }
                                                                                                                        />
                                                                                                                    ),
                                                                                                                },
                                                                                                                {
                                                                                                                    active: tab("nft"),
                                                                                                                    style: { flex: 1 },
                                                                                                                    children: <Nft filter={searchFilter} />,
                                                                                                                },
                                                                                                                {
                                                                                                                    active: tab("activity"),
                                                                                                                    style: { flex: 1 },
                                                                                                                    children: (
                                                                                                                        <Activity filter={searchFilter} />
                                                                                                                    ),
                                                                                                                },
                                                                                                            ]}
                                                                                                        />
                                                                                                    </Layouts.Col>
                                                                                                </Layouts.Contents.InnerContent>
                                                                                            </Layouts.Box>
                                                                                        ),
                                                                                    },
                                                                                ]}
                                                                            />
                                                                        ),
                                                                    },
                                                                    {
                                                                        active: !!asset,
                                                                        children: (
                                                                            <Layouts.Contents.SlideContainer
                                                                                vertical
                                                                                offset={100}
                                                                                style={{ position: "absolute", width: "100%", height: "100%" }}
                                                                                contents={[
                                                                                    {
                                                                                        active: !asset,
                                                                                        children: <></>,
                                                                                    },
                                                                                    {
                                                                                        active: !!asset,
                                                                                        children: (
                                                                                            <Layouts.Col
                                                                                                gap={0}
                                                                                                style={{ background: "rgba(var(--black),.45)", padding: "2em" }}
                                                                                                fill>
                                                                                                <Layouts.Col gap={0} fill>
                                                                                                    <Parts.Numberpads.Currency
                                                                                                        type="currency"
                                                                                                        width={width}
                                                                                                        value={amount}
                                                                                                        max={asset?.balance}
                                                                                                        onChange={(e: any, v: any) => setAmount(v)}
                                                                                                    />
                                                                                                    <Layouts.Row gap={2}>
                                                                                                        <Controls.Button
                                                                                                            onClick={() => {
                                                                                                                setAsest(undefined);
                                                                                                                setAmount("");
                                                                                                            }}>
                                                                                                            Back
                                                                                                        </Controls.Button>
                                                                                                        <Layouts.Row
                                                                                                            style={{
                                                                                                                ...(condition
                                                                                                                    ? { maxWidth: "100%", opacity: 1 }
                                                                                                                    : {
                                                                                                                          maxWidth: 0,
                                                                                                                          opacity: 0,
                                                                                                                          marginLeft: "-2em",
                                                                                                                          pointerEvents: "none",
                                                                                                                          curosr: "default",
                                                                                                                      }),
                                                                                                                transition: ".3s ease",
                                                                                                            }}>
                                                                                                            <Controls.Button
                                                                                                                type={"glass"}
                                                                                                                onClick={handleConfirmAmount}>
                                                                                                                Confirm
                                                                                                            </Controls.Button>
                                                                                                        </Layouts.Row>
                                                                                                    </Layouts.Row>
                                                                                                </Layouts.Col>
                                                                                            </Layouts.Col>
                                                                                        ),
                                                                                    },
                                                                                ]}
                                                                            />
                                                                        ),
                                                                    },
                                                                ]}
                                                            />
                                                        </Layouts.Contents.InnerContent>
                                                    </>
                                                ),
                                            },
                                        ]}
                                    />
                                ),
                            },
                            {
                                active: level === 1,
                                children: <Stages.Contact stage={{ name: "", level }} onSelect={handleConfirmRecipient} />,
                            },
                            {
                                active: level > 1,
                                children: <Stages.Tx />,
                            },
                        ]}
                    />
                )}
            </AnimatePresence>
        </Layouts.Page>
    );
}
