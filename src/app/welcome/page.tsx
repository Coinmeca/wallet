"use client";

import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Stages } from "containers";
import { useAccount, useStorage } from "hooks";
import { AnimatePresence } from "framer-motion";

export default function Welcome() {
    const router = useRouter();
    const { storage, session } = useStorage();
    const { account } = useAccount();

    const [load, setLoad] = useState(false);
    const [stage, setStage] = useState({ name: "welcome", level: 0 });

    useEffect(() => {
        const init = storage?.get("init");
        const userId = storage?.get("userId");
        if (userId) {
            if (!init) storage?.set("init", "complete");
<<<<<<< HEAD
            router.push("/");
        } else {
            const key = session?.get("key");
            const wallets = storage?.get(`${key}:wallets`);
            // fixme:
            if (!wallets || wallets?.length) setStage({ name: "setup", level: 0 })
            else setLoad(true);
        }
=======

            const key = session?.get("key");
            if (key) {
                const wallets: any = storage?.get(`${key}:wallets`);

                if (!wallets || !wallets.length) {
                    setStage({ name: "create", level: 0 });
                    setLoad(true);
                } else router.push("/");
            } else router.push("/lock");
        } else setLoad(true);
>>>>>>> dev
    }, []);

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
                            children: <Stages.Init stage={stage} setStage={setStage} />,
                        },
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
