"use client";

import { useMemo } from "react";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { Parts } from "@coinmeca/ui/index";
import { format, parseNumber } from "@coinmeca/ui/lib/utils";
import { Asset } from "types";
import { parseChainId } from "@coinmeca/wallet-provider/chains";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { useTranslate } from "hooks";
import { tokenLogo, valid } from "utils";

interface Amount {
    active?: boolean;
    asset?: Asset;
    amount?: string | number;
    min?: string | number;
    max?: string | number;
    responsive?: boolean;
    onChange?: Function;
    onMax?: Function;
    onConfirm?: Function;
    onBack?: Function;
}

export default function Amount(props: Amount) {
    const width = 64;
    const asset = props?.asset;
    const responsive = props?.responsive || false;
    const min = (props?.min && parseNumber(props?.min)) || 0;
    const max = typeof props?.max === "number" ? parseNumber(props?.max) : undefined;

    const { provider } = useCoinmecaWalletProvider();
    const { t } = useTranslate();
    const activeChainId = useMemo(() => {
        const providerChainId = provider?.chainId;
        return typeof providerChainId !== "undefined" && valid.chainId(providerChainId) ? parseChainId(providerChainId) : undefined;
    }, [provider?.chainId]);
    const activeChain = useMemo(
        () =>
            typeof activeChainId === "number"
                ? provider?.chains?.find((item: any) => typeof item?.chainId !== "undefined" && parseChainId(item.chainId) === activeChainId)
                : undefined,
        [activeChainId, provider?.chains],
    );

    const amount = useMemo(() => {
        if (props?.amount) {
            let amt = props?.amount;
            if (typeof max === "number" && props?.amount !== "" && parseNumber(props?.amount) >= max) amt = max;
            else {
                const decimals = props?.asset?.decimals || 0;
                const number = amt?.toString()?.split(".")?.slice(0, 2);
                if (number?.[1]?.length > decimals) amt = [...(number[0] || "0"), ".", ...number[1]?.slice(0, decimals)].join("");
            }
            return format(amt, "currency");
        } else return undefined;
    }, [props?.amount, max]);

    const isMax = useMemo(() => {
        const amt = parseNumber(amount);
        return (amt && max && amt >= max) || false;
    }, [amount, max]);

    const condition = useMemo(() => amount && amount !== "" && parseNumber(amount) > min, [amount]);
    const fontSize = useMemo(() => {
        const size = (100 / (amount?.toString().length || 1)) * 1.5;
        return `clamp(1.25em, ${size > 8 ? 8 : size < 4 ? 4 : size}vw, 750%)`;
    }, [amount]);

    const handleBack = () => {
        props?.onBack?.();
    };

    const handleMax = () => {
        if (max) props?.onMax?.(max);
    };

    const handleConfirm = () => {
        props?.onConfirm?.(parseNumber(amount));
    };

    const handleChange = (v?: string) => {
        props?.onChange?.(!v || v === "" ? undefined : format(v, "number"));
    };

    return (
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
                                    style={{
                                        ...(responsive && { padding: "4em 8em" }),
                                        maxHeight: "48em",
                                    }}
                                    fill>
                                    <Layouts.Col align={"center"} fit>
                                        <Layouts.Row gap={1} fit>
                                            <Elements.Avatar size={2} img={tokenLogo(activeChain?.chainId, asset?.address)} />
                                            <Elements.Text type={"h6"}>{asset?.symbol}</Elements.Text>
                                        </Layouts.Row>
                                        <Layouts.Col gap={0} align={"center"}>
                                            <Layouts.Row gap={0} style={{ opacity: amount?.toString()?.length ? 1 : 0.6 }} fit fix>
                                                <Elements.TextMotion
                                                    type={"strong"}
                                                    style={{ fontSize }}
                                                    motion={{
                                                        initial: {
                                                            translateY: "30%",
                                                            opacity: 0,
                                                        },
                                                        animate: {
                                                            translateY: 0,
                                                            opacity: 1,
                                                        },
                                                        exit: {
                                                            translateY: "-30%",
                                                            opacity: 0,
                                                        },
                                                        transition: { duration: 0.3, ease: [0.25, 1, 0.25, 1] },
                                                    }}>
                                                    {amount || "0"}
                                                </Elements.TextMotion>
                                            </Layouts.Row>
                                            <Controls.Tab active={isMax} scale={1.25} style={{ marginTop: "-0.5em" }} onClick={handleMax} fit>
                                                {isMax ? (
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
                                            </Controls.Tab>
                                        </Layouts.Col>
                                    </Layouts.Col>
                                </Layouts.Col>
                            ),
                        },
                    ]}
                />
            </Layouts.Col>
            <Layouts.Contents.InnerContent style={{ scrollSnapAlign: "start", maxHeight: asset ? "50%" : "100%" }} scroll={false}>
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
                                <Layouts.Col gap={0} style={{ background: "rgba(var(--black),.45)", padding: "2em", overflow: "hidden" }} fill>
                                    <Layouts.Col gap={4} fill>
                                        <Parts.Numberpads.Currency
                                            type="currency"
                                            width={width}
                                            value={amount}
                                            max={max}
                                            padding={1}
                                            onChange={(e: any, v: any) => handleChange(v)}
                                            input={props?.active}
                                        />
                                        <Layouts.Row gap={2}>
                                            <Controls.Button onClick={handleBack}>{t("app.btn.back")}</Controls.Button>
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
                                                <Controls.Button type={"glass"} onClick={handleConfirm}>
                                                    {t("app.btn.confirm")}
                                                </Controls.Button>
                                            </Layouts.Row>
                                        </Layouts.Row>
                                    </Layouts.Col>
                                </Layouts.Col>
                            ),
                        },
                    ]}
                />
            </Layouts.Contents.InnerContent>
        </>
    );
}
