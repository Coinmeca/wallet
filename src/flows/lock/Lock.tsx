"use client";

import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { Parts } from "@coinmeca/ui/index";
import { useTelegram, useAccount } from "hooks";
import { useLayoutEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function Lock() {
    const length = 6;

    const router = useRouter();
    const path = usePathname();

    const { telegram, user } = useTelegram();
    const { account, setAccount } = useAccount();

    const [code, setCode] = useState<string>("");
    const [error, setError] = useState({ state: false, message: "" });

    const handleNumberClick = (code: string) => {
        if (code?.length > length) return;

        setCode(code);
        if (code?.length === length) {
            let key: any;
            if (telegram && user?.id) key = telegram.CloudStorage.getItem(`${user.id}:${code}`);
            else {
                const userId = localStorage.getItem(`userId`);
                console.log('userId', userId);
                if (userId) key = localStorage.getItem(`${userId}:${code}`);
            }

            console.log('key', key);
            if (key) {
                sessionStorage.setItem("key", key);
                setCode("");
                router.push("/");
            } else setError({state:true, message:'The passcode entered was wrong.'})
        } else {
            setError({ state: false, message: "" });
        }
    };

    return (
        <Layouts.Contents.SlideContainer
            vertical
            contents={[
                {
                    active: true,
                    children: (
                        <Layouts.Contents.InnerContent scroll={false}>
                            <Layouts.Col gap={4} align={"center"} fill>
                                <Layouts.Col gap={4} align={"center"} fit>
                                    <Elements.Text weight={"bold"} size={2}>
                                        PASSCODE
                                    </Elements.Text>
                                    <Elements.Passcode index={code?.length || 0} length={length} error={error.state} gap={"5%"} effect />
                                    {error.message !== "" && (
                                        <Elements.Text weight={"bold"} opacity={0.6} color={"red"} style={{ marginTop: "2em" }}>
                                            {error.message}
                                        </Elements.Text>
                                    )}
                                </Layouts.Col>
                            </Layouts.Col>
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
                                    active: false,
                                    children: <></>,
                                },
                                {
                                    active: true,
                                    children: (
                                        <Layouts.Contents.InnerContent scroll={false}>
                                            <Layouts.Col gap={0} style={{ background: "rgba(var(--black),.45)", padding: "2em" }} fill>
                                                <Layouts.Col fill>
                                                    <Parts.Numberpad type="code" value={code} onChange={(e: any, v: any) => handleNumberClick(v)} />
                                                </Layouts.Col>
                                                    <Controls.Button
                                                        onClick={() => router.push("/reset")}
                                                        style={{ margin: "2em", marginTop: 0 }}>
                                                        Reset
                                                    </Controls.Button>
                                                    <Controls.Button
                                                        onClick={() => localStorage?.clear()}
                                                        style={{ margin: "2em", marginTop: 0 }}>
                                                        Clear
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
