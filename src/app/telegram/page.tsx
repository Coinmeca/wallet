"use client";

import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { Parts } from "@coinmeca/ui/index";
import { useTelegram } from "contexts/telegram";
import { useState } from "react";
import { wallet } from "wallet";
import { useId } from "react";

export default function Lock() {
    const userId = useId();
    const length = 6;
    const { telegram, user } = useTelegram();

    const [level, setLevel] = useState({ name: "", stage: 0 });
    const [pass, setPass] = useState<{ code: string; confirm?: string }>({ code: "" });
    const [error, setError] = useState({ state: false, message: "" });

    const handleNumberClick = (v: string) => {
        if (v?.length > length) return;

        setPass((state) => (level.name === "init" && level.stage === 1 ? { ...state, confirm: v } : { code: v }));
        if (v?.length === length) {
            if (level.name === "init") {
                if (level.stage === 0) setLevel((state) => ({ ...state, stage: 1 }));
                else if (level.stage === 1)
                    if (pass.code !== v)
                        setError({
                            state: true,
                            message: "The passcode you entered does not match the passcode initially entered.",
                        });
                    else {
                        if (telegram && user?.id) {
                            const key = wallet().create(`${user.id}:${pass.code}`).privateKey;
                            telegram.CloudStorage.setItem(`${user.id}:${pass.code}`, key);
                            telegram.CloudStorage.setItem("key", key);
                            telegram.CloudStorage.setItem(`${key}:nonce`, "0");
                            setLevel({ name: "create", stage: 0 });
                        } else {
                            localStorage.setItem(`userId`, userId);
                            const key = wallet().create(`${userId}:${pass.code}`).privateKey;
                            localStorage.setItem(`${userId}:${pass.code}`, key);
                            localStorage.setItem(`${key}:nonce`, "0");
                            sessionStorage.setItem("key", key);
                            setLevel({ name: "create", stage: 0 });
                        }
                        setPass({ code: "" });
                    }
            }
        } else {
            setError({ state: false, message: "" });
        }
    };

    const handleCreateWallet = () => {
        const key = sessionStorage.getItem("key");
        if (!key || key === "") return;
        if (telegram && user?.id) {
            let nonce: any = telegram.CloudStorage.getItem(`${key}:nonce`);
            if (!nonce)
                setError({
                    state: true,
                    message: "Couldn't find telegram user data. Please try again after terminating this session.",
                });
            nonce = parseInt(nonce.toString()) as number;
            const { privateKey, address } = wallet().create(`${key}:${nonce}`);
            telegram.CloudStorage.setItem(`${key}:${nonce}`, privateKey);
            telegram.CloudStorage.setItem(`${key}:nonce`, `${nonce + 1}`);
            console.log(address);
        } else {
            let nonce: any = localStorage.getItem(`${key}:nonce`);
            if (!nonce)
                setError({
                    state: true,
                    message: "Couldn't find telegram user data. Please try again after terminating this session.",
                });
            nonce = parseInt(nonce.toString()) as number;
            const { privateKey, address } = wallet().create(`${key}:${nonce}`);
            localStorage.setItem(`${key}:${nonce}`, privateKey);
            localStorage.setItem(`${key}:nonce`, `${nonce + 1}`);
            console.log(address);
        }
    };

    const handleImportWallet = (seed: string) => {
        // error
        if (seed.length !== 64) return;
        
        const key = sessionStorage.getItem("key");
        
        // error
        if (!key || key === "") return;

        const address = wallet(seed).address;
        if (telegram && user?.id) {
            let nonce: any = telegram.CloudStorage.getItem(`${key}:nonce`);
            if (!nonce)
                setError({
                    state: true,
                    message: "Couldn't find telegram user data. Please try again after terminating this session.",
                });
            nonce = parseInt(nonce.toString()) as number;
            telegram.CloudStorage.setItem(`${key}:${nonce}`, seed);
            telegram.CloudStorage.setItem(`${key}:nonce`, `${nonce + 1}`);
            console.log(address);
            setLevel({ name: "create", stage: 0 });
        } else {
            let nonce: any = localStorage.getItem(`${key}:nonce`);
            if (!nonce)
                setError({
                    state: true,
                    message: "Couldn't find telegram user data. Please try again after terminating this session.",
                });
            nonce = parseInt(nonce.toString()) as number;
            localStorage.setItem(`${key}:${nonce}`, seed);
            localStorage.setItem(`${key}:nonce`, `${nonce + 1}`);
            const address = wallet(seed).address;
            console.log(address);
        }

        // error
        if (!address) return;
    };

    return (
        <Layouts.Contents.SlideContainer
            contents={[
                {
                    active: level.name === "",
                    children: (
                        <Layouts.Contents.InnerContent scroll={false}>
                            <Layouts.Col gap={2} align={"center"} style={{ padding: "4em" }} fill>
                                <Layouts.Col align={"center"} fill>
                                    <Layouts.Col gap={4} align={"center"} fit>
                                        <Elements.Text type={"h2"}>Welcome</Elements.Text>
                                        <Elements.Text>
                                            For smooth use, please set a password first. If it has been lost, it is impossible to use or recover all created
                                            wallets on this passcode, so please enter it carefully.
                                        </Elements.Text>
                                    </Layouts.Col>
                                </Layouts.Col>
                                <Layouts.Col gap={4} align={"center"} style={{ margin: 0 }}>
                                    <Controls.Button type={"line"} onClick={() => setLevel({ name: "init", stage: 0 })}>
                                        Get Started
                                    </Controls.Button>
                                </Layouts.Col>
                            </Layouts.Col>
                        </Layouts.Contents.InnerContent>
                    ),
                },
                {
                    active: level.name === "init",
                    children: (
                        <Layouts.Contents.SlideContainer
                        vertical
                        contents={[
                            {
                                active: true,
                                children: (
                                    <Layouts.Contents.InnerContent style={{ padding: "2em" }} scroll={false}>
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
                                                                    <Elements.Text
                                                                        weight={"bold"}
                                                                        opacity={0.6}
                                                                        style={{ marginTop: "2em" }}>
                                                                        Please enter your passcode.
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
                                                active: level.name !== "init",
                                                children: <></>,
                                            },
                                            {
                                                active: level.name === "init",
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
                                                                    }}
                                                                    style={{ margin: '2em', marginTop:0 }}
                                                                >
                                                                    Cancel
                                                                </Controls.Button>
                                                            ) : (
                                                                <Controls.Button
                                                                    onClick={() => {
                                                                        setLevel((state) => ({ ...state, stage: 0 }));
                                                                        setPass({ code: "" });
                                                                        setError({ state: false, message: "" });
                                                                        }}
                                                                        style={{margin:'2em', marginTop:0}}
                                                                    >
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
                {
                    active: level.name === "create",
                    children: (
                        <Layouts.Contents.SlideContainer
                            contents={[
                                {
                                    active: true,
                                    children: (
                                        <Layouts.Contents.InnerContent scroll={false}>
                                            <Layouts.Col align={"center"} style={{ padding: "4em" }} fill>
                                                <Layouts.Col gap={4} align={"center"} fit>
                                                </Layouts.Col>
                                            </Layouts.Col>
                                            <Layouts.Col gap={2} align={"center"} style={{ padding: "4em" }} fill>
                                                <Layouts.Col align={"center"} fill>
                                                    <Layouts.Col gap={4} align={"center"} fit>
                                                        <Elements.Text type={"h2"}>Setup</Elements.Text>
                                                        <Elements.Text weight={"bold"} opacity={0.6}>
                                                            Please create a new wallet or import an exist your other wallet via private key.
                                                        </Elements.Text>
                                                    </Layouts.Col>
                                                </Layouts.Col>
                                                <Controls.Button type={"line"} onClick={() => handleCreateWallet()}>
                                                    Create a new wallet
                                                </Controls.Button>
                                                <Controls.Button type={"line"} onClick={() => setLevel({name:'import', stage:0})}>
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
                    active: level.name === "import",
                    children: (
                        <Layouts.Contents.SlideContainer
                            contents={[
                                {
                                    active: true,
                                    children: (
                                        <Layouts.Contents.InnerContent scroll={false}>
                                            <Layouts.Col align={"center"} style={{ padding: "4em" }} fill>
                                                <Layouts.Col gap={4} align={"center"} fit>
                                                </Layouts.Col>
                                            </Layouts.Col>
                                            <Layouts.Col gap={0} align={"center"} fill>
                                                <Layouts.Col align={"center"} style={{padding:'4em'}} fill>
                                                    <Layouts.Col gap={4} align={"center"} fit>
                                                        <Elements.Text type={"h2"}>Setup</Elements.Text>
                                                        <Elements.Text weight={"bold"} opacity={0.6}>
                                                            Please create a new wallet or import an exist your other wallet via private key.
                                                        </Elements.Text>
                                                    </Layouts.Col>
                                                </Layouts.Col>
                                                <Controls.Input
                                                    type={'password'}
                                                    placeholder={'Please enter the private key of the wallet to be imported here.'}
                                                    left={{ children: <Elements.Icon icon={'wallet'} /> }} style={{ padding: '2em' }}
                                                    onChange={(e:any, v:string) => handleImportWallet(v)}
                                                />
                                                <Controls.Button style={{margin:'4em', marginTop:'2em'}}>
                                                    Cancel
                                                </Controls.Button>
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
