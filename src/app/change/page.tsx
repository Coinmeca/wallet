"use client";

import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { useEffect, useState } from "react";
import { Stages } from "containers";
import { useRouter } from "next/navigation";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import Image from "next/image";

export default function Change() {
    const router = useRouter();
    const { provider } = useCoinmecaWalletProvider();
    const [stage, setStage] = useState({ name: "lock", level: 0 });
    const [code, setCode] = useState("");
    const [error, setError] = useState<any>();

    const handleUnlock = (code: string) => {
        try {
            if (provider?.check(code)) {
                setCode(code);
                setStage({ name: "init", level: 0 });
                return true;
            } else false;
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    const handleConfirm = (passcode: string) => {
        try {
            provider?.change(code, passcode);
            setStage({ name: "complete", level: 0 });
            setCode("");
            return true;
        } catch (e) {
            console.error(e);
            setError({ state: true, message: (e as any)?.message || e });
            return false;
        }
    };

    const handleBack = () => {
        setCode("");
        setStage({ name: "init", level: 0 });
    };

    useEffect(() => {
        return () => setCode("");
    }, []);

    useEffect(() => {
        console.log(stage);
    }, []);

    return (
        <Layouts.Contents.SlideContainer
            key="change"
            contents={[
                {
                    active: stage.name === "lock",
                    children: <Stages.Lock onUnlock={handleUnlock} />,
                },
                {
                    active: stage.name === "init",
                    children: <Stages.Init stage={stage} setStage={setStage} exit={"init"} onConfirm={handleConfirm} />,
                },
                {
                    active: stage.name === "complete",
                    children: !!error ? (
                        <Layouts.Contents.InnerContent scroll={false}>
                            <Layouts.Col gap={2} align={"center"} fill>
                                <Layouts.Contents.InnerContent padding={[4, 4, 0]}>
                                    <Layouts.Col fill>
                                        <Layouts.Col align={"center"} style={{ flex: 1 }}>
                                            <Layouts.Col gap={8} align={"center"} fit>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        maxWidth: "max-content",
                                                        maxHeight: "max-content",
                                                        padding: "1em",
                                                        borderRadius: "100%",
                                                        background: "rgba(var(--white),.15)",
                                                    }}>
                                                    <Image
                                                        src={require("../../assets/animation/failure.gif")}
                                                        width={0}
                                                        height={0}
                                                        alt={""}
                                                        style={{ width: "12em", height: "12em", borderRadius: "100%" }}
                                                    />
                                                </div>
                                            </Layouts.Col>
                                        </Layouts.Col>
                                        <Layouts.Col gap={8} align={"center"} style={{ flex: 1 }} fill>
                                            <Layouts.Col align={"center"} style={{ padding: "4em" }}>
                                                <Layouts.Col gap={4} align={"center"} fit>
                                                    <Elements.Text type={"h3"}>Failure</Elements.Text>
                                                    {error?.message && (
                                                        <Elements.Text size={1} weight={"bold"}>
                                                            {error.message}
                                                        </Elements.Text>
                                                    )}
                                                </Layouts.Col>
                                            </Layouts.Col>
                                        </Layouts.Col>
                                    </Layouts.Col>
                                </Layouts.Contents.InnerContent>
                                <Layouts.Col gap={4} align={"center"} style={{ padding: "4em", paddingTop: 0 }}>
                                    <Layouts.Row gap={2}>
                                        <Controls.Button type={"glass"} onClick={() => handleBack()}>
                                            Try again
                                        </Controls.Button>
                                        <Controls.Button type={"glass"} onClick={() => router.push("/")}>
                                            Go to main
                                        </Controls.Button>
                                    </Layouts.Row>
                                </Layouts.Col>
                            </Layouts.Col>
                        </Layouts.Contents.InnerContent>
                    ) : (
                        <Layouts.Contents.InnerContent scroll={false}>
                            <Layouts.Col gap={2} align={"center"} fill>
                                <Layouts.Contents.InnerContent padding={[4, 4, 0]}>
                                    <Layouts.Col fill>
                                        <Layouts.Col align={"center"} style={{ flex: 1 }}>
                                            <Layouts.Col gap={8} align={"center"} fit>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        maxWidth: "max-content",
                                                        maxHeight: "max-content",
                                                        padding: "1em",
                                                        borderRadius: "100%",
                                                        background: "rgba(var(--white),.15)",
                                                    }}>
                                                    <Image
                                                        src={require("../../assets/animation/success.gif")}
                                                        width={0}
                                                        height={0}
                                                        alt={""}
                                                        style={{ width: "12em", height: "12em", borderRadius: "100%" }}
                                                    />
                                                </div>
                                            </Layouts.Col>
                                        </Layouts.Col>
                                        <Layouts.Col gap={8} align={"center"} style={{ flex: 1 }} fill>
                                            <Layouts.Col align={"center"} style={{ padding: "4em" }}>
                                                <Layouts.Col gap={4} align={"center"} fit>
                                                    <Elements.Text type={"h3"}>Complete</Elements.Text>
                                                    <Elements.Text weight={"bold"} opacity={0.6}>
                                                        The passcode successfully changed.
                                                    </Elements.Text>
                                                </Layouts.Col>
                                            </Layouts.Col>
                                        </Layouts.Col>
                                    </Layouts.Col>
                                </Layouts.Contents.InnerContent>
                                <Layouts.Col gap={4} align={"center"} style={{ padding: "4em", paddingTop: 0 }}>
                                    <Layouts.Row gap={2}>
                                        <Controls.Button type={"glass"} onClick={() => router.push("/")}>
                                            Go to main
                                        </Controls.Button>
                                    </Layouts.Row>
                                </Layouts.Col>
                            </Layouts.Col>
                        </Layouts.Contents.InnerContent>
                    ),
                },
            ]}
        />
    );
}
