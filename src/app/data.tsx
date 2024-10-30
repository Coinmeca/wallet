"use client";

import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { useMobile, useNotification, useWindowSize } from "@coinmeca/ui/hooks";
import { Root } from "@coinmeca/ui/lib/style";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useLayoutEffect, useMemo, useState } from "react";

import Coinmeca from "assets/coinmeca.svg";
import { useAccount, useStorage, useWallet } from "hooks";
import { Avatar } from "@coinmeca/ui/components/elements";
import { Account, Chain } from "types";
import { wallet } from "wallet";

export default function Data() {
    const router = useRouter();
    const path = usePathname();

    const { windowWidth } = useWindowSize();
    const { isMobile } = useMobile();

    const { account, setAccount, chain, setChain } = useAccount();
    const { storage, session } = useStorage();

    const [value, setValue] = useState<number>(0);
    const [tab, setTab] = useState<string>("icon");
    const [active, setActive] = useState(false);
    const [mobileMenu, setMobileMenu] = useState("");

    const [chains, setChains] = useState<Chain[]>();
    const [accounts, setAccounts] = useState<Account[]>();
    const colorMap = path?.startsWith("/asset") ? "red" : path?.startsWith("/exchange") ? "orange" : path?.startsWith("/treasury") ? "blue" : "var(--rainbow)";

    const { addToast } = useNotification();

    const languages = [
        {
            code: "en",
            value: "English",
        },
        {
            code: "sp",
            value: "Español",
        },
        {
            code: "cn",
            value: "中文",
        },
        {
            code: "jp",
            value: "日本語",
        },
        {
            code: "ar",
            value: "عربي",
        },
        {
            value: "한국어",
            code: "ko",
        },
    ];

    useLayoutEffect(() => {
        const key = session?.get("key");
        if (key) {
            setChains(storage?.get(`${key}:chains`));
            setAccounts(
                [...(storage?.get(`${key}:wallets`) || [])]?.map((w) => {
                    const account = storage?.get(wallet(w).address);
                    return account;
                }),
            );
        }
    }, []);

    const chainlist = useCallback(
        (chains: Chain[] = []) => {
            if (chains?.length) {
                return chains.map((c: Chain) => ({
                    onClick: () => {
                        setChain(c);
                        setMobileMenu("");
                    },
                    style: { padding: "2em clamp(2em, 5%, 8em)", ...(chain?.id === c?.id && { opacity: 0.3, pointerEvents: "none" }) },
                    children: [
                        [
                            {
                                children: (
                                    <Layouts.Row gap={2}>
                                        <Layouts.Row gap={1} fit>
                                            <Avatar img={c?.logo} />
                                        </Layouts.Row>
                                        <Elements.Text size={1.5}>{c?.name}</Elements.Text>
                                    </Layouts.Row>
                                ),
                            },
                        ],
                    ],
                }));
            }
        },
        [chain, chains],
    );

    const handleCopyAddress = (account: Account) => {
        navigator.clipboard
            .writeText(account.address)
            .then(function () {
                addToast({
                    title: `Copy address`,
                    message: `The address of ${account.name} copied.`,
                });
                // addToast(toast.alert.copy.success);
            })
            .catch(function (err) {
                addToast({
                    title: `Copy address`,
                    message: `Failed to copy the address of ${account.name}.`,
                });
                // addToast(toast.alert.copy.failure);
            });
    };

    const accountlist = useCallback(
        (accounts: Account[] = []) => {
            if (accounts?.length) {
                return accounts.map((a: Account) => {
                    const selected = account?.address?.toLowerCase() !== a?.address?.toLowerCase();
                    return {
                        onClick: selected && (() => {}),
                        style: { padding: "2em clamp(2em, 5%, 8em)", ...(selected && { pointerEvents: "none" }) },
                        children: [
                            [
                                {
                                    children: (
                                        <Layouts.Row gap={1} fill fix>
                                            <Layouts.Row
                                                gap={2}
                                                style={{ overflow: "hidden", ...(account?.address === a?.address && { opacity: 0.3 }) }}
                                                fill
                                                fix>
                                                <Layouts.Row fit>
                                                    <Elements.Avatar
                                                        // color={colorMap}
                                                        scale={1.25}
                                                        size={2.5}
                                                        // display={6}
                                                        // ellipsis={" ... "}
                                                        character={`${a?.index + 1}`}
                                                        name={a?.address}
                                                        stroke={0.1}
                                                        hideName
                                                    />
                                                </Layouts.Row>
                                                <Layouts.Col gap={0} style={{ overflow: "hidden" }}>
                                                    <Elements.Text size={1.5} height={1.375} title={a?.name} fix>
                                                        {a?.name}
                                                    </Elements.Text>
                                                    <Elements.Text size={1.375} height={1.375} weight={"light"} opacity={0.6} title={a?.address} fix>
                                                        {a?.address}
                                                    </Elements.Text>
                                                </Layouts.Col>
                                            </Layouts.Row>
                                            <Layouts.Row gap={0} style={{ pointerEvents: "initial" }} fit>
                                                <Controls.Button icon={"copy"} onClick={() => handleCopyAddress(a)} />
                                                <Controls.Button icon={"more"} />
                                            </Layouts.Row>
                                        </Layouts.Row>
                                    ),
                                },
                            ],
                        ],
                    };
                });
            }
        },
        [account, accounts],
    );

    const header = {
        color: colorMap,
        logo: !account,
        menu: account && {
            active: mobileMenu === "menu",
            onClick: () => (mobileMenu === "menu" ? setMobileMenu("") : setMobileMenu("menu")),
            children: [
                {
                    name: "Activity",
                    href: "/activity",
                    onClick: () => setMobileMenu(""),
                },
                {
                    name: "Token",
                    href: "/token",
                    onClick: () => setMobileMenu(""),
                },
                {
                    name: "NFT",
                    href: "/nft",
                    onClick: () => setMobileMenu(""),
                },
                {
                    name: "Test",
                    href: "/test",
                    onClick: () => setMobileMenu(""),
                },
            ],
        },
        // option: {
        //     active: true,
        //     children: (
        //     ),
        // },
        side: account && {
            width: 48,
            active: true,
            // style: { ...(windowWidth <= Root.Device.Tablet && isMobile && { flexDirection: "column-reverse" }) },
            children: (
                <>
                    {/* <Controls.Tab
                        onClick={() => {
                            if (!sidebar && mobileMenu !== "") setMobileMenu("");
                            setSidebar(!sidebar);
                        }}
                        active={sidebar}
                        iconLeft={"sidebar"}
                        hide={"desktop"}
                        toggle
                        fit
                    /> */}
                    <Layouts.Row fit>
                        {account?.address && (
                            <Layouts.Row gap={0} fit>
                                <Controls.Tab
                                    active={mobileMenu === "accounts"}
                                    onClick={() => setMobileMenu(mobileMenu === "accounts" ? "" : "accounts")}
                                    toggle>
                                    <Elements.Avatar
                                        // color={colorMap}
                                        scale={0.666}
                                        size={2.5}
                                        display={6}
                                        ellipsis={" ... "}
                                        character={`${account?.index + 1}`}
                                        name={account?.address}
                                    />
                                </Controls.Tab>
                                <Controls.Button icon={"copy"} title={"Copy address"} />
                            </Layouts.Row>
                        )}
                    </Layouts.Row>
                    <Layouts.Row gap={0} align={"right"}>
                        <Controls.Tab active={mobileMenu === "chains"} onClick={() => setMobileMenu(mobileMenu === "chains" ? "" : "chains")} toggle fit>
                            {mobileMenu === "chains" ? (
                                <Elements.Icon icon={"x"} scale={0.666} />
                            ) : (
                                <Elements.Avatar
                                    // color={colorMap}
                                    scale={0.666}
                                    size={2.5}
                                    display={6}
                                    ellipsis={" ... "}
                                    img={chain?.logo}
                                    // character={`${account?.index + 1}`}
                                    // name={account?.address}
                                />
                            )}
                        </Controls.Tab>
                        <Controls.Tab
                            active={mobileMenu === "setting"}
                            onClick={() => setMobileMenu(mobileMenu === "setting" ? "" : "setting")}
                            iconLeft={"gear"}
                            show={"tablet"}
                            toggle
                            fit
                        />
                    </Layouts.Row>
                </>
            ),
        },
        panels: [
            {
                active: mobileMenu === "accounts",
                children: (
                    <Layouts.Col gap={0} fill>
                        <Controls.Input
                            placeholder={"Search chain by id or name..."}
                            left={{ children: <Elements.Icon icon={"search"} style={{ marginRight: "0.5em" }} /> }}
                            style={{ padding: "2em clamp(0em, 3.75%, 6em)" }}
                        />
                        <Layouts.List list={accounts} formatter={accountlist} />
                        <Layouts.Col style={{ padding: "4em", paddingTop: "2em" }} fit>
                            <Controls.Button
                                type={"line"}
                                icon={"plus"}
                                onClick={() => {
                                    router.push("/create");
                                }}>
                                Create or Import wallet
                            </Controls.Button>
                        </Layouts.Col>
                    </Layouts.Col>
                ),
            },
            {
                active: mobileMenu === "chains",
                children: (
                    <Layouts.Col gap={0} fill>
                        <Controls.Input
                            placeholder={"Search chain by id or name..."}
                            left={{ children: <Elements.Icon icon={"search"} style={{ marginRight: "0.5em" }} /> }}
                            style={{ padding: "2em clamp(0em, 3.75%, 6em)" }}
                        />
                        <Layouts.List list={chains} formatter={chainlist} />
                    </Layouts.Col>
                ),
            },
            {
                active: mobileMenu === "setting",
                children: (
                    <>
                        <Controls.Button>second</Controls.Button>
                    </>
                ),
            },
        ],
    };

    const footer = {
        logo: {
            href: "",
            src: <Coinmeca height={"6em"} />,
            style: { maxWidth: "16em" },
        },
        menus: [
            {
                gap: 2,
                children: [
                    // {
                    //     href: `/asset/${chain?.id || "-"}`,
                    //     name: "Asset",
                    // },
                ],
            },
        ],
        side: {
            gap: 2,
            fit: true,
            children: [
                {
                    gap: 0,
                    children: [
                        <>
                            <Controls.Button icon={"discord"} title={"Discord"} fit />
                        </>,
                        <>
                            <Controls.Button icon={"twitter"} title={"X"} fit />
                        </>,
                        <>
                            <Controls.Button icon={"telegram"} title={"Telegram"} fit />
                        </>,
                        <>
                            <Controls.Button icon={"book"} title={"Documents"} fit />
                        </>,
                        <>
                            <Controls.Button icon={"medium"} title={"Medium"} fit />
                        </>,
                    ],
                },
                [
                    <>
                        <Controls.Button type={"line"}>Contact us</Controls.Button>
                    </>,
                ],
            ],
        },
        bottom: "Copyright © 2024 Coinmeca. All rights reserved.",
    };

    return {
        value,
        setValue,
        tab,
        setTab,
        active,
        setActive,
        header,
        footer,
    };
}
