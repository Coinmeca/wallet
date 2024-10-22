"use client";

import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { Parts } from "@coinmeca/ui/index";
import { useTelegram, useAccount } from "hooks";
import { useCallback, useLayoutEffect, useState } from "react";
import { wallet } from "wallet";
import { useId } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function Lock() {
    const userId = useId();
    const length = 6;

    const router = useRouter();
    const path = usePathname();

    const { telegram, user } = useTelegram();
    const { account, setAccount } = useAccount();

    const [code, setCode] = useState<string>("");
    const [error, setError] = useState({ state: false, message: "" });

    const handleConfirm = () => {
        let key;
        if (telegram && user?.id) {
            key = wallet().create(`${user.id}:${code}`).privateKey;
            telegram.CloudStorage.setItem(`${user.id}:${code}`, key);
        } else {
            key = wallet().create(`${userId}:${code}`).privateKey;
            localStorage.setItem(`userId`, userId);
            localStorage.setItem(`${userId}:${code}`, key);
        }
    };

    const handleNumberClick = (v: string) => {
        if (v?.length > length) return;

        setCode(v);
        if (v?.length === length) {
            let key: any;
            if (code !== v)
                setError({
                    state: true,
                    message: "The passcode you entered does not match the passcode initially entered.",
                });
            else {
                if (telegram && user?.id) key = telegram.CloudStorage.getItem(`${user.id}:${code}`);
                else key = localStorage.getItem(`${userId}:${code}`);

                if (key) {
                    sessionStorage.setItem("key", key);
                    setCode("");
                    router.push("/");
                } else {
                    // error
                }
            }
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
