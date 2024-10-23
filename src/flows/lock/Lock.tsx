"use client";

import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { Parts } from "@coinmeca/ui/index";
import { useTelegram, useAccount } from "hooks";
import { useLayoutEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePortal } from "@coinmeca/ui/hooks";
import { Modal } from "@coinmeca/ui/containers";
import { wallet } from "wallet";

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
            const storage = (telegram && user?.id) ? telegram.CloudStorage : localStorage;
            if (telegram && user?.id) key = storage.getItem(`${user.id}:${code}`);
            else {
                const userId = storage.getItem(`userId`);
                console.log('userId', userId);
                if (userId) key = storage.getItem(`${userId}:${code}`);
            }

            console.log('key', key);
            if (key) {
                sessionStorage.setItem("key", key);
                let last:any = storage.getItem(`last`);
                let wallets:any = storage.getItem(`${key}:wallets`);
                if (wallets) wallets = JSON.parse(wallets) as string[];

                const info:any = storage.getItem(`${wallet(wallets[last ? parseInt(last) : 0]).address}`);
                if (info) setAccount(JSON.parse(info));

                setCode("");
                router.push("/");
            } else setError({ state: true, message: 'The passcode entered was wrong.' })
        } else setError({ state: false, message: "" });
    };

    const ResetModal = () => {
        return <Modal title={'Reset Confirmation'} message={'Setup the all configuration from the first. Are you sure?'} buttonArea={
            <>
                <Controls.Button onClick={closeResetConfirm}>NO</Controls.Button>
                <Controls.Button onClick={() => router.push('/reset')}>YES</Controls.Button>
            </>
        } onClose={closeResetConfirm} close />
    }
    const [showResetConfirm, closeResetConfirm] = usePortal(<ResetModal/>);


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
                                                        onClick={showResetConfirm}
                                                        style={{ margin: "2em", marginTop: 0 }}
                                                    >
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
