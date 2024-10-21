"use client";

import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { Parts } from "@coinmeca/ui/index";
import { useState } from "react";

export default function Lock() {
    const length = 6;
    const [pass, setPass] = useState<{ code: string; confirm?: string }>({ code: "", confirm: "" });
    const [error, setError] = useState({ state: false, message: "" });

    const handleNumberClick = (v: string) => {
        if (v?.length > length) return;

        setPass((state) => (level.name === "create" && level.stage === 1 ? { ...state, confirm: v } : { code: v }));
        if (v?.length === length) {
            if (level.name === "create") {
                if (level.stage === 0) setLevel((state) => ({ ...state, stage: 1 }));
                else if (level.stage === 1)
                    if (pass.code !== v)
                        setError({
                            state: true,
                            message: "The passcode you entered does not match the passcode initially entered.",
                        });
                    else console.log("confirm");
            }
        } else {
            setError({ state: false, message: "" });
        }
    };

    const [level, setLevel] = useState({ name: "", stage: 0 });

    return (
        <Layouts.Contents.SlideContainer
            contents={[
                {
                    active: level.name === "",
                    children: (
                        <Layouts.Contents.SlideContainer
                            contents={[
                                {
                                    active: true,
                                    children: (
                                        <Layouts.Contents.InnerContent scroll={false}>
                                            <Layouts.Col align={"center"} style={{ padding: "4em" }} fill>
                                                <Layouts.Col gap={4} align={"center"} fit>
                                                    <Elements.Text type={"h2"}>Welcome</Elements.Text>
                                                    <Elements.Text weight={"bold"} opacity={0.6}>
                                                        Please create a new wallet or import an exist your other wallet via private key.
                                                    </Elements.Text>
                                                </Layouts.Col>
                                            </Layouts.Col>
                                            <Layouts.Col gap={2} align={"center"} style={{ padding: "4em" }} fill>
                                                <Layouts.Col align={"center"} fill>
                                                    <Layouts.Col gap={4} align={"center"} fit>
                                                        <Elements.Text type={"h2"}>Welcome</Elements.Text>
                                                        <Elements.Text weight={"bold"} opacity={0.6}>
                                                            Please create a new wallet or import an exist your other wallet via private key.
                                                        </Elements.Text>
                                                    </Layouts.Col>
                                                </Layouts.Col>
                                                <Controls.Button type={"line"} onClick={() => setLevel({ name: "create", stage: 0 })}>
                                                    Create a new wallet
                                                </Controls.Button>
                                                <Controls.Button type={"line"} onClick={() => setLevel({ name: "create", stage: 0 })}>
                                                    Import an exist wallet
                                                </Controls.Button>
                                            </Layouts.Col>
                                        </Layouts.Contents.InnerContent>
                                    ),
                                },
                            ]}
                        />
                    ),
                },
                {
                    active: level.name === "create",
                    children: (
                        <Layouts.Contents.SlideContainer
                            contents={[
                                {
                                    active: true,
                                    children: (
                                        <Layouts.Contents.SlideContainer
                                            vertical
                                            contents={[
                                                {
                                                    active: true,
                                                    children: (
                                                        <Layouts.Contents.SlideContainer
                                                            contents={[
                                                                {
                                                                    active: level.stage === 0,
                                                                    children: (
                                                                        <Layouts.Contents.InnerContent scroll={false}>
                                                                            <Layouts.Col gap={4} align={"center"} fill>
                                                                                <Layouts.Col gap={4} align={"center"} fit>
                                                                                    <Elements.Text weight={"bold"} size={2}>
                                                                                        PASSCODE
                                                                                    </Elements.Text>
                                                                                    <Elements.Passcode
                                                                                        index={pass.code.length}
                                                                                        length={length}
                                                                                        error={error.state}
                                                                                        gap={"5%"}
                                                                                        effect
                                                                                    />
                                                                                    <Elements.Text weight={"bold"} opacity={0.6} style={{ marginTop: "2em" }}>
                                                                                        Please enter your passcode. If it has been lost, it is impossible to use
                                                                                        or recover all created wallets on this passcode, so please enter it
                                                                                        carefully.
                                                                                    </Elements.Text>
                                                                                </Layouts.Col>
                                                                            </Layouts.Col>
                                                                        </Layouts.Contents.InnerContent>
                                                                    ),
                                                                },
                                                                {
                                                                    active: level.stage === 1,
                                                                    children: (
                                                                        <Layouts.Contents.InnerContent scroll={false}>
                                                                            <Layouts.Col gap={4} align={"center"} fill>
                                                                                <Layouts.Col gap={4} align={"center"} fit>
                                                                                    <Elements.Text weight={"bold"} size={2}>
                                                                                        PASSCODE CHECK
                                                                                    </Elements.Text>
                                                                                    <Elements.Passcode
                                                                                        index={pass.confirm?.length || 0}
                                                                                        length={length}
                                                                                        error={error.state}
                                                                                        gap={"5%"}
                                                                                        effect
                                                                                    />
                                                                                    {error.message !== "" && (
                                                                                        <Elements.Text
                                                                                            weight={"bold"}
                                                                                            opacity={0.6}
                                                                                            color={"red"}
                                                                                            style={{ marginTop: "2em" }}>
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
                                                                    active: level.name !== "create",
                                                                    children: <></>,
                                                                },
                                                                {
                                                                    active: level.name === "create",
                                                                    children: (
                                                                        <Layouts.Contents.InnerContent scroll={false}>
                                                                            <Layouts.Col
                                                                                gap={0}
                                                                                style={{ background: "rgba(var(--black),.45)", padding: "2em" }}
                                                                                fill>
                                                                                <Layouts.Col fill>
                                                                                    <Parts.Numberpad
                                                                                        type="code"
                                                                                        value={level.stage === 0 ? pass.code : pass.confirm}
                                                                                        onChange={(e: any, v: any) => handleNumberClick(v)}
                                                                                    />
                                                                                </Layouts.Col>
                                                                                {level.stage === 0 ? (
                                                                                    <Controls.Button
                                                                                        onClick={() => {
                                                                                            setLevel({ name: "", stage: 0 });
                                                                                            setPass({ code: "" });
                                                                                        }}>
                                                                                        Cancel
                                                                                    </Controls.Button>
                                                                                ) : (
                                                                                    <Controls.Button
                                                                                        onClick={() => {
                                                                                            setLevel((state) => ({ ...state, stage: 0 }));
                                                                                            setPass({ code: "" });
                                                                                        }}>
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
                                    ),
                                },
                            ]}
                        />
                    ),
                },
                {
                    active: level.name === "verify",
                    children: (
                        <Layouts.Contents.SlideContainer
                            contents={[
                                {
                                    active: true,
                                    children: (
                                        <Layouts.Col gap={4} align={"center"} fill>
                                            <Layouts.Col gap={4} align={"center"} fit>
                                                <Elements.Text weight={"bold"} size={2}>
                                                    PIN
                                                </Elements.Text>
                                                <Elements.Passcode index={pass.code.length} length={length} error={error.state} gap={"5%"} effect />
                                                {error.state && error.message !== "" && (
                                                    <Elements.Text weight={"bold"} size={2}>
                                                        {error.message}
                                                    </Elements.Text>
                                                )}
                                            </Layouts.Col>
                                        </Layouts.Col>
                                    ),
                                },
                                {
                                    active: true,
                                    children: (
                                        <Layouts.Contents.SlideContainer
                                            contents={[
                                                {
                                                    active: true,
                                                    children: (
                                                        <Layouts.Col fill>
                                                            <Parts.Numberpad
                                                                type="code"
                                                                value={pass.code}
                                                                onChange={(e: any, v: any) => handleNumberClick(v)}
                                                                style={{ background: "rgba(var(--black),.45)" }}
                                                            />
                                                        </Layouts.Col>
                                                    ),
                                                },
                                            ]}
                                        />
                                    ),
                                },
                            ]}
                            vertical
                        />
                    ),
                },
            ]}
        />
    );
}
