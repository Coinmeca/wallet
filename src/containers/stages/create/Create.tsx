"use client";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { useAccount, useStorage } from "hooks";
import { wallet } from "wallet";
import { Stage } from "..";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Create({ setStage }: Stage) {
    const router = useRouter();
    const { storage, session } = useStorage();
    const { setAccount } = useAccount();
    const [create, setCreate] = useState(false);

    const handleCreateWallet = () => {
        if (create) return router.push("/");

        const key = session?.get("key");
        console.log("created key", key);
        // error
        if (!key || key === "") return;

        const wallets: string[] = storage?.get(`${key}:wallets`) || [];

        setAccount(() => {
            let info: any;
            const { privateKey, address } = wallet().create(`${key}:${wallets.length}`);
            if (wallets.find((w: string) => w?.toLowerCase() === privateKey?.toLowerCase())) {
                info = storage?.get(address);
                if (info) return info;
            } else info = { address, name: `Wallet ${wallets.length + 1}`, index: wallets.length };
            storage?.set("last", `${wallets.length}`);
            wallets.push(privateKey);

            storage?.set(`${key}:wallets`, wallets);
            storage?.set(`${address}`, info);
            return info;
        });

        storage?.set("init", "complete");
        router.push("/");
        setCreate(false);
        // console.log("wallets", wallets);
    };

    return (
        <Layouts.Contents.SlideContainer
            contents={[
                {
                    active: true,
                    children: (
                        <Layouts.Contents.InnerContent scroll={false}>
                            <Layouts.Col align={"center"} style={{ padding: "4em" }} fill>
                                <Layouts.Col gap={4} align={"center"} fit>
                                    {" "}
                                </Layouts.Col>
                            </Layouts.Col>
                            <Layouts.Col gap={2} align={"center"} style={{ padding: "4em" }} fill>
                                <Layouts.Col align={"center"} fill>
                                    <Layouts.Col gap={4} align={"center"} fit>
                                        <Elements.Text type={"h2"}> Setup </Elements.Text>
                                        <Elements.Text weight={"bold"} opacity={0.6}>
                                            Please create a new wallet or import an exist your other wallet via private key.
                                        </Elements.Text>
                                    </Layouts.Col>
                                </Layouts.Col>
                                <Controls.Button type={"line"} onClick={() => handleCreateWallet()}>
                                    Create a new wallet
                                </Controls.Button>
                                <Controls.Button type={"line"} onClick={() => setStage({ name: "import", level: 0 })}>
                                    Import an exist wallet
                                </Controls.Button>
                            </Layouts.Col>
                        </Layouts.Contents.InnerContent>
                    ),
                },
            ]}
        />
    );
}
