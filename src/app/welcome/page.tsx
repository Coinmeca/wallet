"use client";

import CryptoJS from "crypto-js";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { AnimatePresence } from "framer-motion";

import { Stages } from "containers";
import { useAccount, useStorage, useTelegram } from "hooks";
import { getChainsByType } from "chains";

export default function Welcome() {
    const router = useRouter();
    const { telegram, user } = useTelegram();
    const { storage, session } = useStorage();
    const { account } = useAccount();

    const [load, setLoad] = useState(false);
    const [stage, setStage] = useState({ name: "welcome", level: 0 });

    useEffect(() => {
        const init = storage?.get("init");
        const userId = storage?.get("userId");
        if (userId) {
            if (!init) storage?.set("init", "complete");
            const key = session?.get("key");
            if (key) {
                const wallets: any = storage?.get(`${key}:wallets`);
                if (!wallets || !wallets.length) {
                    setStage({ name: "create", level: 0 });
                    setLoad(true);
                } else router.push("/");
            } else router.push("/lock");
        } else setLoad(true);
    }, []);

    const handleConfirm = (passcode: string) => {
        passcode = CryptoJS.SHA256(passcode).toString();
        const userId = telegram && user?.id ? user.id : crypto.randomUUID();
        const key = CryptoJS.SHA256(`${userId}:${passcode}`).toString();

        storage?.set("userId", userId);
        storage?.set(`${userId}:${passcode}`, key);
        storage?.set(`${key}:chains`, getChainsByType('mainnet'));
        
        session?.set("key", key);
        return true;
    }

    return (
        <AnimatePresence>
            {load && (
                <Layouts.Contents.SlideContainer
                    key="welcome"
                    contents={[
                        {
                            active: stage.name === "welcome",
                            children: <Stages.Welcome stage={stage} setStage={setStage} />,
                        },
                        {
                            active: stage.name === "init",
                            children: <Stages.Init stage={stage} setStage={setStage} exit={'welcome'} onConfirm={handleConfirm} />,
                        },
                        // {
                        //     active: stage.level === 2,
                        //     children: (
                        //         <Layouts.Contents.SlideContainer
                        //             contents={[
                        //                 {
                        //                     active: true,
                        //                     children: (
                        //                         <Layouts.Contents.InnerContent scroll={false}>
                        //                             <Layouts.Col align={"center"} style={{ padding: "4em" }} fill>
                        //                                 <Layouts.Col gap={4} align={"center"} fit>
                        //                                     <Elements.Text type={"h6"} opacity={0.6}>
                        //                                     BIOMETRIC
                        //                                     </Elements.Text>
                        //                                     <Elements.Icon
                        //                                         icon={"wallet"}
                        //                                         scale={3}
                        //                                         style={{ padding: "0.5em", borderRadius: "4em", background: "rgba(var(--white),.15)" }}
                        //                                     />
                        //                                     <Elements.Text type={"h6"}>
                        //                                         test
                        //                                     </Elements.Text>
                        //                                 </Layouts.Col>
                        //                             </Layouts.Col>
                        //                             <Layouts.Col gap={0} align={"center"} fill>
                        //                                 <Layouts.Col align={"center"} style={{ padding: "4em" }} fill>
                        //                                     <Layouts.Col gap={4} align={"center"} fit>
                        //                                         {" "}
                        //                                     </Layouts.Col>
                        //                                     <Controls.Button style={{ margin: "4em", marginTop: "2em" }}>YES</Controls.Button>
                        //                                     <Controls.Button style={{ margin: "4em", marginTop: "2em" }}>NO</Controls.Button>
                        //                                 </Layouts.Col>
                        //                             </Layouts.Col>
                        //                         </Layouts.Contents.InnerContent>
                        //                     ),
                        //                 },
                        //             ]}
                        //         />
                        //     ),
                        // },
                        {
                            active: stage.name === "create",
                            children: <Stages.Create stage={stage} setStage={setStage} />,
                        },
                        {
                            active: stage.name === "import",
                            children: <Stages.Import stage={stage} setStage={setStage} />,
                        },
                        {
                            active: stage.name === "wallet",
                            children: (
                                <Layouts.Contents.SlideContainer
                                    contents={[
                                        {
                                            active: true,
                                            children: (
                                                <Layouts.Contents.InnerContent scroll={false}>
                                                    <Layouts.Col align={"center"} style={{ padding: "4em" }} fill>
                                                        <Layouts.Col gap={4} align={"center"} fit>
                                                            <Elements.Text type={"h6"} opacity={0.6}>
                                                                {account?.name}
                                                            </Elements.Text>
                                                            <Elements.Icon
                                                                icon={"wallet"}
                                                                scale={3}
                                                                style={{ padding: "0.5em", borderRadius: "4em", background: "rgba(var(--white),.15)" }}
                                                            />
                                                            <Elements.Text type={"h6"}>
                                                                {account?.address &&
                                                                    `${account.address.substring(
                                                                        0,
                                                                        account.address.startsWith("0x") ? 6 : 4,
                                                                    )} ... ${account.address.substring(account.address.length - 4, account.address.length)}`}
                                                            </Elements.Text>
                                                        </Layouts.Col>
                                                    </Layouts.Col>
                                                    <Layouts.Col gap={0} align={"center"} fill>
                                                        <Layouts.Col align={"center"} style={{ padding: "4em" }} fill>
                                                            <Layouts.Col gap={4} align={"center"} fit>
                                                                {" "}
                                                            </Layouts.Col>
                                                            <Controls.Button style={{ margin: "4em", marginTop: "2em" }}> Cancel </Controls.Button>
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
            )}
        </AnimatePresence>
    );
}
