"use client";

import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { Parts } from "@coinmeca/ui/index";
import { useState, useEffect } from "react";
import { usePortal } from "@coinmeca/ui/hooks";
import { Modals } from "containers";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import NumberFlow, { NumberFlowGroup } from "@number-flow/react";
import { AnimatePresence } from "motion/react";
import Image from "next/image";
import { usePathname } from "next/navigation";

const Countdown = ({ seconds, style }: { seconds: number; style?: object }) => {
    const hh = Math.floor(seconds / 3600);
    const mm = Math.floor((seconds % 3600) / 60);
    const ss = seconds % 60;
    return (
        <NumberFlowGroup>
            <div
                style={{
                    margin: "0.2em auto 0.1em",
                    fontSize: "5em",
                    fontWeight: 750,
                    fontVariantNumeric: "tabular-nums",
                    color: "rgb(var(--red))",
                }}>
                {!!seconds && seconds >= 3600 && <NumberFlow trend={-1} value={hh} format={{ minimumIntegerDigits: 2 }} />}
                <NumberFlow
                    prefix={!!seconds && seconds >= 3600 ? ":" : undefined}
                    trend={-1}
                    value={mm}
                    digits={{ 1: { max: 5 } }}
                    format={{ minimumIntegerDigits: 2 }}
                />
                <NumberFlow prefix=":" trend={-1} value={ss} digits={{ 1: { max: 5 } }} format={{ minimumIntegerDigits: 2 }} />
            </div>
        </NumberFlowGroup>
    );
};

export default function Lock(props?: { onUnlock?: Function; isModal?: boolean }) {
    const width = 64;
    const length = 6;

    const path = usePathname();
    const { provider } = useCoinmecaWalletProvider();

    const [code, setCode] = useState<string>("");
    const [error, setError] = useState({ state: false, message: "" });

    const [openResetConfirm, closeResetConfirm] = usePortal(() => <Modals.Reset onReset={handleReset} onClose={closeResetConfirm} close />);

    const handleNumberClick = async (code: string) => {
        if (!!provider?.locked?.remain || code?.length > length) return;

        setCode(code);
        if (code?.length === length) {
            if (!props?.onUnlock?.(code)) setError({ state: true, message: "The entered passcode was wrong." });
        } else setError({ state: false, message: "" });
    };

    const handleReset = (e?: any) => {
        provider?.reset();
        window.location.href = "/welcome";
        window.location.reload();
        closeResetConfirm();
    };

    useEffect(() => {
        if (provider && !!provider?.locked?.remain) {
            const interval = setInterval(() => {
                if (!!provider?.locked?.remain) setError({ state: true, message: `Locked out. Please try it later.` });
                else {
                    setError({ state: false, message: "" });
                    setCode("");
                }
            }, 1000);
            return () => {
                clearInterval(interval);
                setError({ state: false, message: "" });
                setCode("");
            };
        }
    }, [provider, code]);

    return (
        <Layouts.Contents.SlideContainer
            vertical
            style={props?.isModal ? { overflow: "hidden auto" } : {}}
            contents={[
                {
                    active: true,
                    style: {
                        transition: ".3s ease",
                        ...(props?.isModal && { minHeight: "max-content" }),
                        ...(!!provider?.locked?.remain && { minHeight: "100%" }),
                    },
                    children: (
                        <Layouts.Contents.InnerContent scroll={false}>
                            <Layouts.Col gap={4} align={"center"} fill>
                                <Layouts.Col
                                    gap={4}
                                    align={"center"}
                                    style={{ minHeight: 0, transition: ".3s ease", ...(!!provider?.locked?.remain && { minHeight: "100%" }) }}
                                    fit>
                                    <AnimatePresence>
                                        <Layouts.Col align={"center"} fit>
                                            <Layouts.Col gap={4}>
                                                <AnimatePresence>
                                                    {!!provider?.locked?.remain ? (
                                                        <Layouts.Col key={"locked-image"} gap={32} align={"center"} fit>
                                                            <Image
                                                                width={0}
                                                                height={0}
                                                                alt={""}
                                                                src={require("../../../assets/animation/lock.gif")}
                                                                style={{
                                                                    opacity: 0,
                                                                    maxHeight: 0,
                                                                    width: "16em",
                                                                    height: "16em",
                                                                    transition: ".3s ease",
                                                                    ...(!!provider?.locked?.remain && {
                                                                        opacity: 1,
                                                                        maxHeight: "16em",
                                                                    }),
                                                                }}
                                                            />
                                                            <Layouts.Col>
                                                                <Elements.Text weight={"bold"} size={2}>
                                                                    LOCKED
                                                                </Elements.Text>
                                                                <Countdown seconds={provider?.locked?.remain || 0} />
                                                            </Layouts.Col>
                                                        </Layouts.Col>
                                                    ) : (
                                                        <Layouts.Col key={"unlock-passcode"}>
                                                            <Elements.Text weight={"bold"} size={2}>
                                                                PASSCODE
                                                            </Elements.Text>
                                                            <Elements.Passcode
                                                                width={width}
                                                                index={code?.length || 0}
                                                                length={length}
                                                                error={error.state}
                                                                style={{ margin: "2em auto 1em" }}
                                                                gap={"5%"}
                                                                effect
                                                            />
                                                        </Layouts.Col>
                                                    )}
                                                    {error.message !== "" && (
                                                        <Layouts.Col
                                                            gap={2}
                                                            align={"center"}
                                                            key={"error-message"}
                                                            style={{
                                                                margin: 0,
                                                                opacity: 0,
                                                                maxHeight: 0,
                                                                transition: ".3s ease",
                                                                ...(error.message !== "" && {
                                                                    opacity: 1,
                                                                    maxHeight: "100em",
                                                                }),
                                                            }}>
                                                            <Elements.Text weight={"bold"} color={"red"}>
                                                                {error.message}
                                                            </Elements.Text>
                                                        </Layouts.Col>
                                                    )}
                                                </AnimatePresence>
                                            </Layouts.Col>
                                        </Layouts.Col>
                                        {!!provider?.locked?.remain && (
                                            <Layouts.Col
                                                align={"center"}
                                                style={{
                                                    margin: 0,
                                                    opacity: 0,
                                                    maxHeight: 0,
                                                    padding: "2em",
                                                    transition: ".3s ease",
                                                    ...(error.message !== "" && {
                                                        opacity: 1,
                                                        maxHeight: "100em",
                                                    }),
                                                }}>
                                                <Controls.Button onClick={openResetConfirm} fit={!!!provider?.locked?.remain}>
                                                    Reset Passcode
                                                </Controls.Button>
                                            </Layouts.Col>
                                        )}
                                    </AnimatePresence>
                                </Layouts.Col>
                            </Layouts.Col>
                        </Layouts.Contents.InnerContent>
                    ),
                },
                {
                    active: true,
                    style: props?.isModal ? { minHeight: "max-content" } : {},
                    children: (
                        <Layouts.Contents.SlideContainer
                            offset={100}
                            vertical
                            contents={[
                                {
                                    active: !!provider?.locked?.remain,
                                    children: <></>,
                                },
                                {
                                    active: !!!provider?.locked?.remain,
                                    children: (
                                        <Layouts.Contents.InnerContent scroll={false}>
                                            <Layouts.Col
                                                gap={0}
                                                style={{
                                                    transition: ".3s ease",
                                                    background: `rgba(var(--black),.45)`,
                                                    ...(!props?.isModal && { padding: "2em" }),
                                                    ...(!!provider?.locked?.remain && { opacity: 0.6, cursor: "default", pointerEvents: "none" }),
                                                }}
                                                fill>
                                                <Layouts.Col
                                                    style={{
                                                        transition: ".3s ease",
                                                        ...(!!provider?.locked?.remain && { opacity: 0.6, cursor: "default", pointerEvents: "none" }),
                                                    }}
                                                    fill>
                                                    <Parts.Numberpad
                                                        type="code"
                                                        width={width}
                                                        value={code}
                                                        padding={props?.isModal ? 0 : undefined}
                                                        onChange={(e: any, v: any) => handleNumberClick(v)}
                                                        shuffle
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
    );
}
