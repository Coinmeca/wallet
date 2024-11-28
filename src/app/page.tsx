"use client";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { useWindowSize } from "@coinmeca/ui/hooks";
import { Parts } from "@coinmeca/ui/index";
import { Root } from "@coinmeca/ui/lib/style";
import { format, parseNumber } from "@coinmeca/ui/lib/utils";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { toBytes } from "@coinmeca/wallet-sdk/utils";
import { useQueries } from "@tanstack/react-query";
import { GetBalance } from "api/account";
import { GetMaxFeePerGas } from "api/onchain";
import { query } from "api/onchain/query";
import { Activity, Nft, Token } from "containers/pages";
import { AnimatePresence } from "framer-motion";
import { usePageLoader } from "hooks";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { Asset } from "types";
import { sanitizeBigIntToHex, short } from "utils";

export default function Main() {
    const path = usePathname();
    const router = useRouter();

    const { windowSize } = useWindowSize();
    const { isLoad } = usePageLoader();
    const { account, chain } = useCoinmecaWalletProvider();
    const { data: balance, isLoading } = GetBalance(chain?.rpcUrls?.[0], account?.address);
    const [searchFilter, setSearchFilter] = useState("");

    const responsive = useMemo(() => windowSize.width <= Root.Device.Tablet, [windowSize]);
    const tab = useCallback((target: string) => path?.startsWith(`/${target}`), [path]);

    const [asset, setAsest] = useState<Asset & { type: "ft" | "nft" }>();

    const [amount, setAmount] = useState<string | number>();
    const [receipent, setReceipent] = useState("");
    const [level, setLevel] = useState(0);
    const [error, setError] = useState<any>();

    const [tx, setTx] = useState<any>();

    const [{ data: nonce }, { data: gasPrice, isLoading: isGasPriceLoading }, { data: estimateGas, isLoading: isEstimateGasLoading }] = useQueries({
        queries: [
            query.nonce(chain?.rpcUrls[0], account?.address),
            query.gasPrice(chain?.rpcUrls[0]),
            query.estimateGas(chain?.rpcUrls[0], sanitizeBigIntToHex(tx)),
        ],
    });

    const condition = useMemo(() => amount && parseNumber(amount) > 10 ** -(asset?.decimals || 1), [amount]);
    const fontSize = useMemo(() => {
        const size = (100 / (amount?.toString().length || 1)) * 1.5;
        return `${size > 8 ? 8 : size < 4 ? 4 : size}vw`;
    }, [amount]);

    const {
        data: { maxPriorityFeePerGas, maxFeePerGas },
    } = GetMaxFeePerGas(chain?.rpcUrls[0]);

    const handleCancel = () => {
        setAmount("");
        setAsest(undefined);
        setLevel(0);
    };

    const handleConfirm = () => {
        setTx({
            method: "eth_sendTransaction",
            to: asset?.address,
            from: account?.address,
            data: `0xa9059cbb` + receipent.toLowerCase().padStart(64, "0") + BigInt(Number(amount)).toString(16).padStart(64, "0"),
            nonce: BigInt(nonce || 0),
            chainId: Number(chain?.chainId || 1),
            gasLimit: BigInt(estimateGas?.raw || 0),
            gasPrice: BigInt(gasPrice?.raw || 0),
            maxFeePerGas: BigInt(maxFeePerGas?.raw || 0),
            maxPriorityFeePerGas: BigInt(maxPriorityFeePerGas?.raw || 0),
        });
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
                                                                                    <Layouts.Row gap={1} fit>
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
                                                                                            opacity={amount === "0" ? 0.6 : amount?.length || 0.6}>
                                                                                            {format(amount, "currency", {
                                                                                                unit: 9,
                                                                                                limit: 12,
                                                                                                fix: 9,
                                                                                                display: false,
                                                                                            })}
                                                                                        </Elements.Text>
                                                                                        <Controls.Button onClick={() => setAmount(asset?.balance)}>
                                                                                            {/* <Elements.Text opacity={0.6}> */}
                                                                                            {format(asset?.balance, "currency", {
                                                                                                unit: 9,
                                                                                                limit: 12,
                                                                                                fix: 9,
                                                                                            })}{" "}
                                                                                            {asset?.symbol}
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
                                                                                            <Layouts.Box padding={[2, "", "", ""]} fit>
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
                                                                                                        value={amount}
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
                                                                                                                onClick={handleConfirm}>
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
                                children: <>choose address</>,
                            },
                            {
                                active: level > 1,
                                children: (
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
                                                                                        level === 2
                                                                                            ? `https://web3.coinmeca.net/${
                                                                                                  chain?.chainId
                                                                                              }/${asset?.address?.toLowerCase()}/logo.svg`
                                                                                            : require(`../assets/animation/${
                                                                                                  level === 3 ? "success" : "failure"
                                                                                              }.gif`)
                                                                                    }
                                                                                    alt={asset?.symbol || "Unknown"}
                                                                                    style={{ width: "8em", height: "8em" }}
                                                                                />
                                                                            </div>
                                                                            <Layouts.Col gap={1}>
                                                                                <Elements.Text type={"h6"}>{asset?.symbol || ""}</Elements.Text>
                                                                                <Elements.Text type={"strong"} opacity={0.6}>
                                                                                    {asset?.name}
                                                                                </Elements.Text>
                                                                            </Layouts.Col>
                                                                        </Layouts.Col>
                                                                    </Layouts.Col>
                                                                    {/* <Layouts.Col gap={8} align={"center"} style={{ flex: 1 }} fill> */}
                                                                    <Layouts.Contents.SlideContainer
                                                                        style={{ flex: 1 }}
                                                                        contents={[
                                                                            {
                                                                                active: level < 2,
                                                                                children: <></>,
                                                                            },
                                                                            {
                                                                                active: level === 2,
                                                                                style: { display: "flex", minHeight: "max-content" },
                                                                                children: (
                                                                                    <Layouts.Col
                                                                                        gap={8}
                                                                                        style={{ flex: 1, height: "100%", minHeight: "max-content" }}
                                                                                        fill>
                                                                                        <Layouts.Col
                                                                                            style={level === 2 ? { minHeight: "max-content" } : {}}
                                                                                            reverse
                                                                                            fill>
                                                                                            <Layouts.Box
                                                                                                style={{
                                                                                                    "--white": "255,255,255",
                                                                                                    "--black": "0, 0, 0",
                                                                                                    background: "rgba(var(--white),.15)",
                                                                                                    maxHeight: "max-content",
                                                                                                    padding: "clamp(2em, 7.5%, 4em)",
                                                                                                    width: "auto",
                                                                                                    height: "auto",
                                                                                                }}
                                                                                                fit>
                                                                                                <Layouts.Col gap={2} align={"left"}>
                                                                                                    <Layouts.Col gap={0.5}>
                                                                                                        <Elements.Text
                                                                                                            type={"desc"}
                                                                                                            weight={"bold"}
                                                                                                            opacity={0.6}>
                                                                                                            Gas Price
                                                                                                        </Elements.Text>
                                                                                                        <Elements.Text>
                                                                                                            {isGasPriceLoading
                                                                                                                ? "~"
                                                                                                                : format(gasPrice?.format, "currency", {
                                                                                                                      unit: 9,
                                                                                                                      limit: 12,
                                                                                                                      fix: 9,
                                                                                                                  })}
                                                                                                        </Elements.Text>
                                                                                                    </Layouts.Col>
                                                                                                    <Layouts.Col gap={0.5}>
                                                                                                        <Elements.Text
                                                                                                            type={"desc"}
                                                                                                            weight={"bold"}
                                                                                                            opacity={0.6}>
                                                                                                            Estimated Gas
                                                                                                            {/* // error: if 0, wrong tx */}
                                                                                                        </Elements.Text>
                                                                                                        <Elements.Text>
                                                                                                            {isEstimateGasLoading
                                                                                                                ? "~"
                                                                                                                : format(estimateGas?.format, "currency", {
                                                                                                                      unit: 9,
                                                                                                                      limit: 12,
                                                                                                                      fix: 9,
                                                                                                                  })}
                                                                                                        </Elements.Text>
                                                                                                    </Layouts.Col>
                                                                                                    <Layouts.Col gap={0.5}>
                                                                                                        <Elements.Text
                                                                                                            type={"desc"}
                                                                                                            weight={"bold"}
                                                                                                            opacity={0.6}>
                                                                                                            Total
                                                                                                        </Elements.Text>
                                                                                                        <Layouts.Row gap={1} fix>
                                                                                                            <Elements.Text style={{ flex: "initial" }} fix>
                                                                                                                {isGasPriceLoading || isEstimateGasLoading
                                                                                                                    ? "~"
                                                                                                                    : format(
                                                                                                                          (gasPrice?.format || 0) *
                                                                                                                              (estimateGas?.format || 0),
                                                                                                                          "currency",
                                                                                                                          {
                                                                                                                              unit: 9,
                                                                                                                              limit: 12,
                                                                                                                              fix: 9,
                                                                                                                          },
                                                                                                                      )}
                                                                                                            </Elements.Text>
                                                                                                            <Elements.Text opacity={0.6} fit>
                                                                                                                {chain?.nativeCurrency?.symbol}
                                                                                                            </Elements.Text>
                                                                                                        </Layouts.Row>
                                                                                                    </Layouts.Col>
                                                                                                </Layouts.Col>
                                                                                            </Layouts.Box>
                                                                                        </Layouts.Col>
                                                                                    </Layouts.Col>
                                                                                ),
                                                                            },
                                                                            {
                                                                                active: level === 3,
                                                                                children: (
                                                                                    <Layouts.Col gap={0} align={"center"} style={{ height: "100%" }} fill>
                                                                                        <Layouts.Col gap={4} align={"center"} fit>
                                                                                            <Elements.Text type={"h3"}>Complete</Elements.Text>
                                                                                            <Elements.Text size={1} weight={"bold"}>
                                                                                                <Elements.Text opacity={0.6}>Comepete to connect</Elements.Text>{" "}
                                                                                                <Elements.Text>{account?.name}</Elements.Text>{" "}
                                                                                                <Elements.Text opacity={0.6}>
                                                                                                    ({short(account?.address)}) to
                                                                                                </Elements.Text>{" "}
                                                                                                <Elements.Text>{asset?.symbol}</Elements.Text>{" "}
                                                                                                <Elements.Text opacity={0.6}>({asset?.name}).</Elements.Text>
                                                                                            </Elements.Text>
                                                                                        </Layouts.Col>
                                                                                    </Layouts.Col>
                                                                                ),
                                                                            },
                                                                            {
                                                                                active: level === 4,
                                                                                children: (
                                                                                    <Layouts.Col gap={0} align={"center"} style={{ height: "100%" }} fill>
                                                                                        <Layouts.Col gap={4} align={"center"} fit>
                                                                                            <Elements.Text type={"h3"}>Failure</Elements.Text>
                                                                                            <Elements.Text weight={"bold"} opacity={0.6}>
                                                                                                {error?.message || error}
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
                                                                            active: level === 2,
                                                                            children: (
                                                                                <Layouts.Row gap={2}>
                                                                                    <Controls.Button type={"glass"} onClick={handleCancel}>
                                                                                        Cancel
                                                                                    </Controls.Button>
                                                                                    <Controls.Button type={"line"} onClick={handleTransfer}>
                                                                                        Send
                                                                                    </Controls.Button>
                                                                                </Layouts.Row>
                                                                            ),
                                                                        },
                                                                        {
                                                                            active: level > 2,
                                                                            children: (
                                                                                <Layouts.Row gap={2}>
                                                                                    <Controls.Button
                                                                                        type={"glass"}
                                                                                        onClick={() => {
                                                                                            setAmount("");
                                                                                            setAsest(undefined);
                                                                                            setLevel(0);
                                                                                        }}>
                                                                                        Go to main
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
                                ),
                            },
                        ]}
                    />
                )}
            </AnimatePresence>
        </Layouts.Page>
    );
}
