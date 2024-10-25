"use client";

import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { useMobile, useWindowSize } from "@coinmeca/ui/hooks";
import { Root } from "@coinmeca/ui/lib/style";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import Coinmeca from "assets/coinmeca.svg";
import { useAccount } from "hooks";

export default function Data() {
    const path = usePathname();
    const router = useRouter();

    const { account } = useAccount();

    const { windowWidth } = useWindowSize();
    const { isMobile } = useMobile();

    const [value, setValue] = useState<number>(0);
    const [tab, setTab] = useState<string>("icon");
    const [active, setActive] = useState(false);

    const [mobileMenu, setMobileMenu] = useState("");
    const [sidebar, setSidebar] = useState(false);

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

    const header = {
        color: colorMap,
        logo: !account,
        menu: account && {
            active: mobileMenu === "menu",
            onClick: () => (mobileMenu === "menu" ? setMobileMenu("") : setMobileMenu("menu")),
            children: [
                {
                    name: "Activity",
                    path: "/activity",
                    onClick: () => setMobileMenu(""),
                },
                {
                    name: "Token",
                    path: "/token",
                    onClick: () => setMobileMenu(""),
                },
                {
                    name: "NFT",
                    path: "/nft",
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
                            onClick={() => (mobileMenu === "setting" ? setMobileMenu("") : setMobileMenu("setting"))}
                            active={mobileMenu === "setting"}
                            toggle
                            fit>
                            <Elements.Avatar
                                // color={colorMap}
                                scale={0.666}
                                size={2.5}
                                display={6}
                                ellipsis={" ... "}
                                img={
                                    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAMAAABF0y+mAAAAnFBMVEVHcEy63veQu9qfzvCfzu+6vMGfzvCg0PGg0PGfzu+fz/H///+ipq77/f7///8hMUf///8UIzqg0PEQrf+Js9IeLUMWKkIHITz19/idn6XU1dgCEC4hJzgnR2NpeotFTl0UWISNuNiCqsdTYXNtkKshO1V/g40Yda8Vi88Qo/U2QVJ5rNDl5+qWyOyMk5wSluF3vetDtPy62/Qxeapv+0azAAAAD3RSTlMAEeV4xPyb3zGpREV4vabElXnOAAABVklEQVQokX2S6ZKCMBCEsTwQ90gmMQnILSJHibq77/9u28FaC3B1/oWv00N6xnGGtV47z2q9EGLxP555QhwOQnizRzYXYh8TxXsh5hO0cUVekGJMUZELdzNu1iVas760TrpB6xWalcS0MUoZoxmVaL26Mc82U0wnQZCmQZBoeKO110M3D5W18zlPl5wHBgcV5u4NbglHOnK+CzkEVsloO4ThjvOzFZg6mkLV+tzXEBwzWaoJNGdcYpz7bS2raApxKYFgqaW8TKAqcMmcIKBGyliNoAlwKeX8RFElre8QhnhkYQVxFUvZjKCG6ymEa1o10UXKTA2gscn0gkZm8K2jO0R8cG0hOGcAJXzv8SF4+0hjs+1BLeXPX/AYGb4f++gigCyT1/vIMOwP7pONjhR8L6Nho96WNluGUJuvbrwmtt7xryVRe31cMNTs87t7tprOy6Xu8Rj9AiYRKklhMZHhAAAAAElFTkSuQmCC"
                                }
                                // character={`${account?.index + 1}`}
                                // name={account?.address}
                            />
                        </Controls.Tab>
                        <Controls.Tab
                            onClick={() => (mobileMenu === "setting" ? setMobileMenu("") : setMobileMenu("setting"))}
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
