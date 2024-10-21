"use client";

import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { useMobile, useNotification, useWindowSize } from "@coinmeca/ui/hooks";
import { Root } from "@coinmeca/ui/lib/style";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import Coinmeca from "assets/coinmeca.svg";

export default function Data() {
    const path = usePathname();
    const router = useRouter();

    const { windowWidth } = useWindowSize();
    const { isMobile } = useMobile();

    const [value, setValue] = useState<number>(0);
    const [tab, setTab] = useState<string>("icon");
    const [active, setActive] = useState(false);

    const [mobileMenu, setMobileMenu] = useState("");
    const [sidebar, setSidebar] = useState(false);

    const colorMap = path?.startsWith("/asset")
        ? "red"
        : path?.startsWith("/exchange")
        ? "orange"
        : path?.startsWith("/treasury")
        ? "blue"
        : "var(--rainbow)";

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
        logo: true,
        menu: {
            active: mobileMenu === "menu",
            onClick: () => (mobileMenu === "menu" ? setMobileMenu("") : setMobileMenu("menu")),
            children: [
                // {
                //     active: path?.startsWith("/asset"),
                //     name: `${t("app.menu.asset")}`,
                //     href: `/asset/${chain?.id || "-"}`,
                //     onClick: () => {
                //         setSidebar(false);
                //         setMobileMenu("");
                //     },
                // },
            ],
        },
        option: {
            active: true,
            children: (
                <>
                    <Controls.Tab
                        onClick={() => {
                            if (!sidebar && mobileMenu !== "") setMobileMenu("");
                            setSidebar(!sidebar);
                        }}
                        active={sidebar}
                        iconLeft={"sidebar"}
                        hide={"desktop"}
                        toggle
                        fit
                    />
                    <Controls.Tab
                        onClick={() => {
                            if (mobileMenu === "notify") {
                                setMobileMenu("");
                                // setRead(true);
                            } else {
                                // setRead(false);
                                setMobileMenu("notify");
                            }
                        }}
                        active={mobileMenu === "notify"}
                        toggle
                        fit
                    />
                    <Controls.Tab
                        onClick={() => (mobileMenu === "setting" ? setMobileMenu("") : setMobileMenu("setting"))}
                        active={mobileMenu === "setting"}
                        iconLeft={"gear"}
                        show={"tablet"}
                        toggle
                        fit
                    />
                </>
            ),
        },
        side: {
            active: mobileMenu === "setting",
            style: { ...(windowWidth <= Root.Device.Tablet && isMobile && { flexDirection: "column-reverse" }) },
            children: (
                <>
                    <Layouts.Row style={{ ...(windowWidth <= Root.Device.Tablet && isMobile && { order: 1 }) }} fit>

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