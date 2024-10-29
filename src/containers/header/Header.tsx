"use client";

import { cloneElement, isValidElement, useCallback, useEffect, useState } from "react";
import { Layouts } from "@coinmeca/ui/components";
import { useWindowSize } from "@coinmeca/ui/hooks";
import { Root } from "@coinmeca/ui/lib/style";

import { animate, AnimatePresence, stagger } from "framer-motion";
import { Logo, Menu, MenuButton, Nav, Side, Style } from "./Header.styled";

import Link from "next/link";
import Image from "next/image";
import Coinmeca from "assets/coinmeca.svg";
import { Panel } from "@coinmeca/ui/components/layouts/panel/Panel";

export interface Header {
    logo?: Logo | boolean;
    menu?: {
        button?: boolean;
        active?: boolean;
        style?: object;
        children?: Menu[];
        onClick?: Function;
    };
    option?: {
        active?: boolean;
        style?: object;
        children?: any;
    };
    side?: Side;
    panels?: Panel[]
    scale?: number;
    height?: number;
    color?: string;
    style?: object;
}

export interface Logo {
    src?: string | Function | React.ReactElement;
    url?: string;
    width?: number;
    height?: number;
    title?: string;
    alt?: string;
    href?: string;
    style?: object;
}

export interface Menu {
    active?: boolean;
    name?: string;
    href?: string;
    onClick?: Function;
}

export interface Side {
    width?: number;
    active?: boolean;
    style?: object;
    children?: any;
}

export default function Header(props: Header) {
    const { windowSize } = useWindowSize();
    const scale = props?.scale || 1;
    const height = props?.height || 8;
    const color = props?.color || "white";

    const side = props?.side?.width || 60;

    const LogoImage = useCallback(() => {
        const _props =
            typeof props?.logo === "object"
                ? {
                      width: typeof props?.logo?.width === "number" ? props?.logo?.width : 0,
                      height: typeof props?.logo?.height === "number" ? props?.logo?.height : 0,
                      style: {
                          ...(typeof props?.logo?.width === "string" && { width: `${props?.logo?.width}` }),
                          ...(typeof props?.logo?.height === "string" && { height: `${props?.logo?.height}` }),
                          ...props?.logo?.style,
                      },
                      title: props?.logo?.title,
                      alt: props?.logo?.alt || "",
                  }
                : undefined;
        return (
            props?.logo &&
            (typeof props?.logo === "boolean" || !props?.logo?.src ? (
                <Coinmeca
                    height={"5em"}
                    style={props?.style}
                    title={typeof props?.logo === "object" ? props?.logo?.title : undefined}
                    alt={typeof props?.logo === "object" ? props?.logo?.alt : ""}
                />
            ) : typeof props?.logo?.src === "string" ? (
                <Image src={props?.logo?.src} {..._props!} />
            ) : isValidElement(props?.logo?.src) ? (
                cloneElement(props?.logo?.src, ...(_props as any))
            ) : typeof props?.logo?.src === "function" ? (
                props?.logo?.src(_props)
            ) : (
                props?.logo?.src
            ))
        );
    }, [props?.logo]);

    const [mobileMenu, setMobileMenu] = useState(false);

    useEffect(() => {
        if (props?.menu?.children && props?.menu?.children?.length > 0) {
            if (windowSize.width <= Root.Device.Tablet) {
                animate("nav", mobileMenu ? { opacity: 1, transform: "translateY(0)" } : { opacity: 0, transform: "translateY(-15%)" }, {
                    ease: "easeInOut",
                    duration: 0.3,
                    delay: mobileMenu ? stagger(0.05) : 0,
                });
            } else {
                animate(
                    "nav",
                    { opacity: 1, transform: "translateX(0)" },
                    {
                        ease: "easeInOut",
                        duration: 0.3,
                        delay: mobileMenu ? stagger(0.05) : 0,
                    },
                );
            }
        }
    }, [mobileMenu, windowSize.width]);

    useEffect(() => {
        if (typeof props?.menu?.active === "boolean") setMobileMenu(props?.menu?.active);
    }, [props?.menu?.active]);

    return (
        <Style $scale={scale} $color={color} $height={height} $side={side} style={props?.style}>
            <Layouts.Row gap={0}>
                <Layouts.Row>
                    <Layouts.Row>
                        <AnimatePresence>
                            {props?.menu && props?.menu?.button && (
                                <MenuButton
                                    key={"menuButton"}
                                    $active={mobileMenu}
                                    onClick={(e: any) => {
                                        if (typeof props?.menu?.onClick === "function") props?.menu?.onClick(e);
                                        setMobileMenu(!mobileMenu);
                                    }}>
                                    <div>
                                        <div></div>
                                        <div></div>
                                        <div></div>
                                    </div>
                                </MenuButton>
                            )}
                            {props?.logo && (
                                <Logo key={"logo"} href={typeof props?.logo === "object" ? props?.logo?.href : "/"}>
                                    <LogoImage />
                                </Logo>
                            )}
                            {props?.menu?.children && props?.menu?.children?.length > 0 && (
                                <Menu accessKey={"menu"} data-active={mobileMenu} onClick={() => setMobileMenu(false)}>
                                    {props?.menu?.children?.map((v: Menu, k: number) => (
                                        <Nav
                                            key={k}
                                            $scale={scale}
                                            $color={color}
                                            data-active={v?.active}
                                            onClick={(e: any) => {
                                                if (typeof v?.onClick === "function") v?.onClick(e);
                                                setMobileMenu(false);
                                            }}>
                                            <Link href={v?.href || ""}>{v?.name}</Link>
                                        </Nav>
                                    ))}
                                </Menu>
                            )}
                        </AnimatePresence>
                    </Layouts.Row>
                </Layouts.Row>
                {props?.side?.children && (
                    <Side $scale={scale} $width={side} data-active={props?.side?.active} style={props?.side?.style}>
                        <Layouts.Row gap={1}>{props?.side?.children}</Layouts.Row>
                    </Side>
                )}
                {(props?.panels && props?.panels?.length) && (
                    <Layouts.Panel active={props?.panels?.find(p => p?.active) ? true : false}>
                        {props?.panels?.map((panel, key) => (<Layouts.Panel key={key} {...panel} fix>{panel?.children}</Layouts.Panel>))}
                    </Layouts.Panel>
                )}
            </Layouts.Row>
        </Style>
    );
}
