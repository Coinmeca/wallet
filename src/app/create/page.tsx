"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { AnimatePresence } from "framer-motion";
import { Stages } from "containers";
import { short } from "utils";

export default function Welcome() {
    const router = useRouter();
    const { provider, account } = useCoinmecaWalletProvider();

    const [load, setLoad] = useState(false);
    const [stage, setStage] = useState({ name: "create", level: 0 });

    useEffect(() => {
        if (provider?.isLocked) router.push("/lock");
        else setLoad(true);
    }, []);

    return (
        <AnimatePresence>
            {load && (
                <Layouts.Contents.SlideContainer
                    key="create"
                    contents={[
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
                                                                {short(account?.address)}
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
