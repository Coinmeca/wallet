"use client";
import CryptoJS from "crypto-js";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { useEffect, useState } from "react";
import { Parts } from "@coinmeca/ui/index";
import { Stage } from "..";

export default function Init({ stage, setStage, exit, onConfirm }: Stage & { exit: string; onConfirm?: (passcode: string) => boolean; reset?: boolean }) {
    const width = 64;
    const length = 6;

    const [pass, setPass] = useState<{ code: string; confirm?: string }>({ code: "" });
    const [error, setError] = useState({ state: false, message: "" });

    const handleNumberClick = (v: string) => {
        if (v?.length > length) return;

        setPass((state) => (stage.name === "init" && stage.level === 1 ? { ...state, confirm: v } : { code: v }));
        if (v?.length === length) {
            if (stage.name === "init") {
                if (stage.level === 0) setStage((state: any) => ({ ...state, level: 1 }));
                else if (stage.level === 1) {
                    if (pass.code !== v)
                        setError({
                            state: true,
                            message: "The passcode you entered does not match the passcode initially entered.",
                        });
                    else {
                        if (typeof onConfirm === "function") onConfirm(CryptoJS.SHA256(pass.code).toString());
                        // setStage(telegram ? { name: "create", level: 2 } : { name: "create", level: 0 });
                    }
                }
            }
        } else {
            setError({ state: false, message: "" });
        }
    };

    useEffect(() => {
        return () => setPass({ code: "" });
    }, []);

    return (
        <Layouts.Contents.SlideContainer
            vertical
            contents={[
                {
                    active: true,
                    children: (
                        <Layouts.Contents.InnerContent scroll={false}>
                            <Layouts.Contents.SlideContainer
                                contents={[
                                    {
                                        active: stage.level === 0,
                                        children: (
                                            <Layouts.Contents.InnerContent scroll={false}>
                                                <Layouts.Col gap={4} align={"center"} fill>
                                                    <Layouts.Col gap={4} align={"center"} fit>
                                                        <Elements.Text weight={"bold"} size={2}>
                                                            NEW PASSCODE
                                                        </Elements.Text>
                                                        <Elements.Passcode
                                                            width={width}
                                                            index={pass.code.length}
                                                            length={length}
                                                            error={error.state}
                                                            gap={"5%"}
                                                            effect
                                                        />
                                                        <Elements.Text weight={"bold"} opacity={0.6} style={{ marginTop: "2em" }}>
                                                            Please enter your passcode.
                                                        </Elements.Text>
                                                    </Layouts.Col>
                                                </Layouts.Col>
                                            </Layouts.Contents.InnerContent>
                                        ),
                                    },
                                    {
                                        active: stage.level === 1,
                                        children: (
                                            <Layouts.Contents.InnerContent scroll={false}>
                                                <Layouts.Col gap={4} align={"center"} fill>
                                                    <Layouts.Col gap={4} align={"center"} fit>
                                                        <Elements.Text weight={"bold"} size={2}>
                                                            CONFIRM PASSCODE
                                                        </Elements.Text>
                                                        <Elements.Passcode
                                                            width={width}
                                                            index={pass.confirm?.length || 0}
                                                            length={length}
                                                            error={error.state}
                                                            gap={"5%"}
                                                            effect
                                                        />
                                                        {error.message !== "" && (
                                                            <Elements.Text weight={"bold"} color={"red"} style={{ marginTop: "2em" }}>
                                                                {error.message}
                                                            </Elements.Text>
                                                        )}
                                                    </Layouts.Col>
                                                </Layouts.Col>
                                            </Layouts.Contents.InnerContent>
                                        ),
                                    },
                                ]}
                            />
                        </Layouts.Contents.InnerContent>
                    ),
                },
                {
                    active: true,
                    children: (
                        <Layouts.Contents.SlideContainer
                            offset={100}
                            vertical
                            contents={[
                                {
                                    active: stage.name !== "init",
                                    children: <></>,
                                },
                                {
                                    active: stage.name === "init",
                                    children: (
                                        <Layouts.Contents.InnerContent scroll={false}>
                                            <Layouts.Col gap={0} style={{ background: "rgba(var(--black),.45)", padding: "2em" }} fill>
                                                <Layouts.Col fill>
                                                    <Parts.Numberpad
                                                        type="code"
                                                        width={width}
                                                        value={stage.level === 0 ? pass.code : pass.confirm}
                                                        onChange={(e: any, v: any) => handleNumberClick(v)}
                                                    />
                                                </Layouts.Col>
                                                {stage.level === 0 ? (
                                                    <Controls.Button
                                                        onClick={() => {
                                                            setStage({ name: exit, level: 0 });
                                                            setPass({ code: "" });
                                                        }}
                                                        style={{ margin: "2em", marginTop: 0 }}>
                                                        Cancel
                                                    </Controls.Button>
                                                ) : (
                                                    <Controls.Button
                                                        onClick={() => {
                                                            setStage((state: any) => ({ ...state, level: 0 }));
                                                            setPass({ code: "" });
                                                            setError({ state: false, message: "" });
                                                        }}
                                                        style={{ margin: "2em", marginTop: 0 }}>
                                                        Back
                                                    </Controls.Button>
                                                )}
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
