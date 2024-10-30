"use client";

import { css, styled } from "styled-components";
import { Root } from "@coinmeca/ui/lib/style";
import * as Row from "@coinmeca/ui/components/layouts/row/Row.styled";
import * as Divider from "@coinmeca/ui/components/layouts/divider/Divider.styled";
import * as Button from "@coinmeca/ui/components/controls/button/Button.styled";
import * as Avatar from "@coinmeca/ui/components/elements/avatar/Avatar.styled";
import * as Dropdown from "@coinmeca/ui/components/controls/dropdown/Dropdown.styled";
import * as Panel from "@coinmeca/ui/components/layouts/panel/Panel.styled";

export const Logo = styled.a`
    max-width: max-content;
    @media all and (min-width: ${Root.Device.Desktop}px) {
        margin-left: calc(var(--unit) * 4);
    }

    @media all and (max-width: ${Root.Device.Tablet}px) {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
    }
`;

export const Nav = styled.nav<{ $scale: number; $color: string }>`
    font-size: ${({ $scale }) => $scale}em;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    max-width: max-content;

    & > a {
        color: ${({ $color }) => ($color === Root.Color($color) ? $color : `rgb(${Root.Color($color)})`)};
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        padding: 0 1.5em;
        font-size: 1.5em;
        font-weight: bold;
        text-decoration: none;
        transition: 0.3s ease;
    }

    &:hover {
        & > * {
            color: white;
        }
    }

    &:after {
        content: "";
        font-size: ${({ $scale }) => $scale}em;
        background-image: linear-gradient(90deg, transparent, white, transparent);
        position: absolute;
        bottom: 0;
        width: 0;
        height: 0.25em;
        opacity: 0;
        transition: 0.3s ease;
    }

    &[data-active="true"] {
        pointer-events: none;

        & > a {
            color: white;
        }

        &:after {
            width: 250%;
            opacity: 1;
        }
    }

    @media all and (max-width: ${Root.Device.Laptop}px) {
        & > a {
            font-size: 1.25em;
        }
    }

    @media all and (max-width: ${Root.Device.Tablet}px) {
        &:after {
            display: none;
        }
    }
`;

export const MenuButton = styled.div<{ $active: boolean }>`
    font-size: 1em;
    display: flex;
    position: absolute;
    top: 1em;
    left: 1em;
    width: 2em;
    height: 1.5em;
    padding: 1.25em 1em;
    opacity: 0;
    transition: 0.3s ease;
    pointer-events: none;

    @media all and (max-width: ${Root.Device.Tablet}px) {
        pointer-events: inherit;
        position: initial;
        cursor: pointer;

        opacity: var(--o045);

        &:hover {
            opacity: var(--o1);
        }

        &:active {
            background: rgba(var(--white), var(--o015));
        }

        ${({ $active }) => $active && `opacity:1;`}

        & > * {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            width: 100%;
            height: 100%;

            & > * {
                position: absolute;
                background: white;
                width: 100%;
                height: 0.2em;
                transition: 0.3s ease;

                &:first-child {
                    top: 0;
                }

                &:nth-child(2) {
                    top: 50%;
                    left: 0;
                    transform: translateY(-50%);
                }

                &:last-child {
                    bottom: 0;
                }

                ${({ $active }) =>
                    $active &&
                    css`
                        opacity: var(--o1);

                        &:first-child {
                            top: 50%;
                            transform: translateY(-50%) rotateZ(45deg);
                        }

                        &:nth-child(2) {
                            top: 50%;
                            left: -100%;
                            opacity: 0;
                        }

                        &:last-child {
                            top: 50%;
                            bottom: 0;
                            transform: translateY(-50%) rotateZ(-45deg);
                        }
                    `}
            }
        }
    }
`;

export const Menu = styled.div`
    display: flex;
    height: 100%;
    opacity: 1;
    transition: 0.3s ease;

    & ${Nav} {
        height: 100%;
    }

    @media all and (max-width: ${Root.Device.Tablet}px) {
        background: rgba(0, 0, 0, 0.9);
        position: fixed;
        top: 6em;
        left: 0;
        flex-direction: column;
        width: calc(100% - (4em * 2));
        height: calc(100% - (4em * 2) - 6em);
        padding: 4em;
        z-index: 100;
        transition: 0.3s ease;

        & > * {
            max-width: initial;
        }

        & ${Nav} {
            font-size: 1.5em;
            height: max-content;

            & > * {
                height: max-content;
                padding: 1.5em;
                justify-content: flex-start;
            }
        }

        &[data-active="false"] {
            /* max-height: 0; */
        }

        &[data-active="true"] {
            /* max-height: 100vh; */
            opacity: 1;
            pointer-events: inherit;
        }
    }
`;

export const Side = styled.div<{ $scale: number; $width: number }>`
    font-size: ${({ $scale }) => $scale}em;
    max-width: ${({ $width }) => $width}em;
    transition: 0.3s ease;
    z-index: 20;

    & > ${Row.default} {
        margin-left: -1em;
        padding-right: 1em;
        padding-left: 0;
        justify-content: space-between;
    }

    @media all and (max-width: ${Root.Device.Tablet}px) {
        max-width: initial;
    }
`;

export const Style = styled.header<{
    $scale: number;
    $color: string;
    $height: number;
    $side: number;
}>`
    position: relative;
    font-size: ${({ $scale }) => $scale}em;
    display: flex;
    flex-direction: column;
    justify-content: center;
    background: rgb(var(--black));
    min-height: ${({ $height }) => $height || 8}em;

    & > ${Row.default} > ${Row.default} {
        padding: 0 3em;

        &:first-child:not(:only-child) {
            padding-right: 2em;
        }
    }

    && ${Row.default} {
        height: 100%;
        flex-flow: row;
        align-items: center;
        z-index: 22;
    }

    &:after {
        position: absolute;
        content: "";
        background: ${({ $color }) => ($color === Root.Color($color) ? $color : `rgb(${Root.Color($color)})`)};
        width: 100%;
        min-height: 0.25em;
        bottom: 0;
        z-index: 21;
    }

    ${Divider.default} {
        background: ${({ $color }) => ($color === Root.Color($color) ? $color : `rgb(${Root.Color($color)})`)};
    }

    & > ${Panel.default} {
        @media all and (min-width: ${Root.Device.Tablet + 1}px) {
            opacity: 0!important;
            pointer-events: none!important;
        }

        position: fixed;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        top: 6em;
        left: 0;
        max-width: initial;
        width:100%;
        height: calc(100% - 6em);
        z-index: 100;
        opacity: 0;
        
        &[data-active="false"] {
            opacity: 0;
            pointer-events: none;
        }
        
        &[data-active="true"] {
            opacity: 1;
            pointer-events: inherit;
        }

        & ${Panel.default} {
            position: absolute;
            width:100%;
            height:100%;
            top: 0;
            opacity: 0;

            ::selection {
                color: black;
                background: white;
            }

            html {
                color-scheme: dark;
            }

            ::-webkit-scrollbar {
                width: 4px;
            }

            ::-webkit-scrollbar-track {
                -webkit-box-shadow: inset 0 0 0 rgba(var(--black), var(--o03));
            }

            ::-webkit-scrollbar-thumb {
                -webkit-box-shadow: inset 0 0 2rem rgba(var(--white), var(--o03));
            }

            &&& > ${Row.default} {
                width: 100%;
                flex-flow: column-reverse;
                height: max-content;
                max-height: max-content;
                padding: 0;
                & ${Row.default} {
                    width: 100%;
                    height: max-content;
                    max-width: initial;
                    max-height: max-content;
                    flex-flow: column;
                    align-items: flex-start;
                    padding: 0;
                }
            }

            &&& ${Row.default} {
                & > *:not(${Row.default}) {
                    font-size: 1.125em;
                    width: 100%;
                    max-width: initial;
                    min-width: initial;
                }
                & ${Button.default} {
                    padding: 1em;
                    & > * > span {
                        width: 100%;
                    }
                }
                & ${Avatar.default} {
                    font-size: 0.75em;
                }
                & ${Dropdown.default} {
                    ${Dropdown.Item} {
                        width: calc(100% - 6em);
                        padding: 1.5em;
                        padding-right: 4.5em;
                        & > i {
                            right: 0.5em;
                        }
                    }
                }
            }
        }
    }

    @media all and (max-width: ${Root.Device.Laptop}px) {
        min-height: 6em;
    }

    @media all and (max-width: ${Root.Device.Tablet}px) {
        & > ${Row.default} {
            & > ${Row.default} {
                max-width: max-content;
                padding: 0 1em;
                transition: 0.3s ease;

                &:first-child:not(:only-child) {
                    padding-right: 1em;
                }
            }

            & > ${`${Row.default}:last-child:not(:only-child)`}, ${Menu}, ${Side} {
                &[data-active="false"] {
                    opacity: 0;
                    pointer-events: none;
                }
            }
        }
    }
`;

export default Style;
