"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { useNotification, useWindowSize } from "@coinmeca/ui/hooks";
import { Root } from "@coinmeca/ui/lib/style";
import { format, parseNumber } from "@coinmeca/ui/lib/utils";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { AnimatePresence } from "framer-motion";

import { Stages } from "containers";
import { Activity, Nft, Token } from "containers/pages";
import { GetBalance } from "api/account";
import { usePageLoader } from "hooks";
import { Asset, AssetType } from "types";

export default function Main({ params }: any) {
    const path = usePathname();
    const router = useRouter();

    const { windowSize } = useWindowSize();
    const { isLoad } = usePageLoader();
    const { provider, chain, account } = useCoinmecaWalletProvider();
    const { data: balance, isLoading } = GetBalance(chain?.rpcUrls?.[0], account?.address);
    const [searchFilter, setSearchFilter] = useState("");

    const [stage, setStage] = useState<{ name: string; level: number }>({ name: "", level: 0 });

    const [asset, setAsset] = useState<Asset<any>>();
    const [amount, setAmount] = useState<string | number>();
    const [recipient, setRecipient] = useState<string>();

    const tab = useCallback((target: string) => path?.startsWith(`/${target}`), [path]);
    const responsive = useMemo(() => windowSize.width <= Root.Device.Tablet, [windowSize]);

    const { addToast } = useNotification();

    const handleSelect = (a: Asset<any>) => {
        switch (a?.type) {
            case AssetType.ERC20:
                if (!a?.balance) return addToast({ title: a?.name, message: "Insufficient balance to send asset." });
            case AssetType.ERC721:
                setAsset(a);
                if (a?.type === AssetType?.ERC721)
                    setStage((state) => ({
                        ...state,
                        level: 1,
                    }));
        }
    };

    const handleCancel = () => {
        setAsset(undefined);
        setAmount(undefined);
        setRecipient(undefined);
        setStage({ name: "", level: 0 });
    };

    const handleChangeAmount = (v?: string) => {
        setAmount(v as string);
    };

    const handleAmount = (v?: number) => {
        setAmount(v as number);
        setStage({ name: "", level: 1 });
    };

    const handleRecipient = (address?: string) => {
        setRecipient(address);
        setStage({ name: "", level: 2 });
    };

    const handleComplete = () => {
        setAsset(undefined);
        setAmount(undefined);
        setRecipient(undefined);
        setStage({ name: "", level: 0 });
    };

    useEffect(() => {
        handleCancel();
    }, [path, provider, chain, account]);

    useEffect(() => {
        const input = (e: any) => {
            if (stage.level === 0) {
                if (e.key === "Escape") {
                    setAsset(undefined);
                    setAmount(undefined);
                    setRecipient(undefined);
                    setStage({ name: "", level: 0 });
                    return;
                }
                if (e.key === "Enter" || e.code === "NumpadEnter") {
                    console.log(parseNumber(amount), asset, 10 ** -(asset?.decimals || 0), parseNumber(amount) >= 10 ** -(asset?.decimals || 0));
                    if (parseNumber(amount) >= 10 ** -(asset?.decimals || 0)) setStage({ name: "", level: 1 });
                    return;
                }
            }
        };

        window.addEventListener("keydown", input);
        return () => window.removeEventListener("keydown", input);
    }, [amount, asset, stage.level]);

    return (
        <Layouts.Page snap>
            <AnimatePresence>
                {isLoad && (
                    <Layouts.Contents.TabContainer
                        contents={[
                            {
                                active: !asset,
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
                                                                        active: false,
                                                                        children: <></>,
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
                                                                                align={responsive ? "center" : "left"}
                                                                                style={{ padding: "4em 8em", maxHeight: "32em" }}
                                                                                fill>
                                                                                <Layouts.Col gap={1}>
                                                                                    <Elements.Text type={"h6"} height={0}>
                                                                                        Balance
                                                                                    </Elements.Text>
                                                                                    <Elements.Text type={"h3"} height={0}>
                                                                                        {isLoading
                                                                                            ? "~"
                                                                                            : format(balance, "currency", {
                                                                                                  unit: 9,
                                                                                                  limit: 12,
                                                                                                  fix: 9,
                                                                                              })}
                                                                                    </Elements.Text>
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
                                                                                                                                handleSelect({
                                                                                                                                    ...a,
                                                                                                                                    type: AssetType.ERC20,
                                                                                                                                })
                                                                                                                            }
                                                                                                                        />
                                                                                                                    ),
                                                                                                                },
                                                                                                                {
                                                                                                                    active: tab("nft"),
                                                                                                                    style: { flex: 1 },
                                                                                                                    children: (
                                                                                                                        <Nft
                                                                                                                            filter={searchFilter}
                                                                                                                            onSelect={(a: Asset) =>
                                                                                                                                handleSelect({
                                                                                                                                    ...a,
                                                                                                                                    type: AssetType.ERC721,
                                                                                                                                })
                                                                                                                            }
                                                                                                                        />
                                                                                                                    ),
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
                                active: !!asset,
                                children: (
                                    <Layouts.Contents.SlideContainer
                                        contents={[
                                            {
                                                active: stage.level === 0 && !asset?.tokenId,
                                                children: (
                                                    <Stages.Input.Amount
                                                        asset={asset}
                                                        amount={amount}
                                                        min={10 ** -(asset?.decimals || 0)}
                                                        max={asset?.balance}
                                                        onChange={handleChangeAmount}
                                                        onMax={handleChangeAmount}
                                                        onConfirm={handleAmount}
                                                        onBack={() => {
                                                            handleChangeAmount(undefined);
                                                            setAsset(undefined);
                                                        }}
                                                    />
                                                ),
                                            },
                                            {
                                                active: stage.level === 1 && ((amount as number) > 0 || !!asset?.tokenId),
                                                children: (
                                                    <Stages.Contact
                                                        stage={stage}
                                                        setStage={setStage}
                                                        onSelect={handleRecipient}
                                                        onBack={() => {
                                                            switch (asset?.type) {
                                                                case AssetType.ERC20:
                                                                    return setStage({ name: "", level: 0 });
                                                                case AssetType.ERC721:
                                                                    setAsset(undefined);
                                                                    return setStage({ name: "", level: 0 });
                                                            }
                                                        }}
                                                    />
                                                ),
                                            },
                                            {
                                                active: stage.level > 1 && !!recipient,
                                                children: (
                                                    <Stages.Tx
                                                        stage={stage}
                                                        setStage={setStage}
                                                        asset={asset}
                                                        amount={parseNumber(amount)}
                                                        recipient={recipient}
                                                        onComplete={handleComplete}
                                                        onBack={() => {
                                                            setRecipient(undefined);
                                                            setStage({ name: "", level: 1 });
                                                            // handleCancel();
                                                        }}
                                                    />
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
