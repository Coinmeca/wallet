"use client";

import CryptoJS from "crypto-js";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { Parts } from "@coinmeca/ui/index";
import { useStorage } from "hooks";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePortal } from "@coinmeca/ui/hooks";
import { Modal } from "@coinmeca/ui/containers";

export default function Lock(props?: {onUnlock?:Function}) {
    const length = 6;
    const router = useRouter();

    const { storage } = useStorage();

    const [code, setCode] = useState<string>("");
    const [error, setError] = useState({ state: false, message: "" });

    const handleNumberClick = (code: string) => {
        if (code?.length > length) return;

        setCode(code);
        if (code?.length === length) {
            try {
                props?.onUnlock?.(CryptoJS.SHA256(code).toString());
            } catch (message:any) {
                setError({ state: true, message, });
            } 
        } else setError({ state: false, message: "" });
    };

    const ResetModal = () => {
        return (
            <Modal
                title={"Reset Confirmation"}
                message={"Setup the all configuration from the first. Are you sure?"}
                buttonArea={
                    <>
                        <Controls.Button onClick={closeResetConfirm}>NO</Controls.Button>
                        <Controls.Button onClick={() => router.push("/reset")}>YES</Controls.Button>
                    </>
                }
                onClose={closeResetConfirm}
                close
            />
        );
    };
    const [showResetConfirm, closeResetConfirm] = usePortal(<ResetModal />);

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
                                        <Layouts.Col gap={2} align={"center"}>
                                            <Elements.Text weight={"bold"} color={"red"}>
                                                {error.message}
                                            </Elements.Text>
                                            <Controls.Button onClick={showResetConfirm} fit>
                                                Reset Passcode
                                            </Controls.Button>
                                        </Layouts.Col>
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
                                                    <Parts.Numberpad type="code" value={code} onChange={(e: any, v: any) => handleNumberClick(v)} shuffle />
                                                </Layouts.Col>
                                                <Controls.Button onClick={() => storage?.clear()} style={{ margin: "2em", marginTop: 0 }}>
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
