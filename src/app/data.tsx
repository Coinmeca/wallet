"use client";

import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { useMobile, useWindowSize } from "@coinmeca/ui/hooks";
import { Root } from "@coinmeca/ui/lib/style";
import { usePathname, useRouter } from "next/navigation";
import { useLayoutEffect, useMemo, useState } from "react";

import Coinmeca from "assets/coinmeca.svg";
import { useAccount, useStorage, useWallet } from "hooks";
import { Avatar } from "@coinmeca/ui/components/elements";
import { Chain } from "types";

export default function Data() {
    const path = usePathname();

    const { account, chain, setChain } = useAccount();
    const { storage, session } = useStorage();
    
    const { windowWidth } = useWindowSize();
    const { isMobile } = useMobile();
    
    const [value, setValue] = useState<number>(0);
    const [tab, setTab] = useState<string>("icon");
    const [active, setActive] = useState(false);
    const [mobileMenu, setMobileMenu] = useState("");
       
    const [chains, setChains] = useState<Chain[]>();
    const colorMap = path?.startsWith("/asset") ? "red" : path?.startsWith("/exchange") ? "orange" : path?.startsWith("/treasury") ? "blue" : "var(--rainbow)";

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
        if (key) setChains(storage?.get(`${key}:chains`));
    }, [])

    const chainlist = useMemo(() => {
        if (chains?.length) {
            return chains.map((c: Chain) => ({
                onClick: () => {
                    setChain(c);
                    setMobileMenu("")
                },
                style: {padding: '2em', ...((chain?.id === c?.id) && {opacity: 0.3, pointerEvents: 'none'})},
                children: [
                    [
                        {
                            children: (
                                <Layouts.Row gap={2}>
                                    <Layouts.Row gap={1} fit>
                                        <Avatar img={c?.logo} />
                                    </Layouts.Row>
                                    <Elements.Text size={1.5}>
                                        {c?.name}
                                    </Elements.Text>
                                </Layouts.Row>
                            ),
                        }
                    ],
                ]
            })
            )}
    }, [chain, chains]);

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
                            <Controls.Dropdown
                                chevron={false}
                                scale={Root.Device.Tablet >= windowWidth ? 1.125 : undefined}
                                option={{
                                    title: account.address,
                                    value: (
                                        <Elements.Avatar
                                            // color={colorMap}
                                            scale={0.666}
                                            size={2.5}
                                            display={6}
                                            ellipsis={" ... "}
                                            character={`${account?.index + 1}`}
                                            name={account?.address}
                                        />
                                    ),
                                }}
                                options={[
                                    { icon: "copy", value: "Copy Address" },
                                    // { icon: "power", value: t("app.wallet.disconnect") },
                                ]}
                                // onClickItem={(e: any, v: any, k: number) => handleUserOption(k)}
                                responsive={isMobile}
                                fix
                            />
                        )}
                    </Layouts.Row>
                    <Layouts.Row gap={0} align={"right"}>
                        <Controls.Tab
                            onClick={() => setMobileMenu(mobileMenu === "chain" ? "" : "chain")}
                            active={mobileMenu === "setting"}
                            toggle
                            fit>
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
                        </Controls.Tab>
                        <Controls.Tab
                            onClick={() => (setMobileMenu(mobileMenu === "setting" ? "" : "setting"))}
                            active={mobileMenu === "setting"}
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
                active: mobileMenu === "chain",
                children: <Layouts.Col gap={0} fill>
                        {/* <Elements.Text type={'strong'} style={{padding:'1em 3em 0.5em'}}>Chains</Elements.Text> */}
                    <Controls.Input placeholder={'Search chain by id or name...'} left={{children:<Elements.Icon icon={'search'} />}} style={ {padding: '2em 4em'}} />
                    {/* <Layouts.Contents.InnerContent padding={[0, 4]}> */}
                        <Layouts.List list={chainlist} style={{padding: '0em 4em'}} />
                    {/* </Layouts.Contents.InnerContent> */}
                </Layouts.Col>,
            },
            {
                active: mobileMenu === "setting",
                children: <>
                    <Controls.Button>second</Controls.Button>
                </>,
            },
        ]
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
