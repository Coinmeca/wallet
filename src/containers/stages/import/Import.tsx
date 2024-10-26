"use client";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { useAccount, useStorage, useTelegram } from "hooks";
import { wallet } from "wallet";
import { Stage } from "..";
import { useRouter } from "next/navigation";

export default function Import({ setStage }: Stage) {
    const router = useRouter();
    const { storage, session } = useStorage();
    const { setAccount } = useAccount();

    const handleImportWallet = (seed: string) => {
        // error
        if (seed.length !== 64) return;

        const key = session?.get("key");
        // error
        if (!key || key === "") return;

        const address = wallet(seed).address;
        // error
        if (!address) return;

        const wallets: string[] = storage?.get(`${key}:wallets`) || [];

        setAccount(() => {
            let info: any;
            if (wallets.find((w: string) => w?.toLowerCase() === seed?.toLowerCase())) {
                info = storage?.get(address);
                if (info) return info;
            } else info = { address, name: `Wallet ${wallets.length + 1}`, index: wallets.length };
            storage?.set("last:wallet", `${wallets.length}`);
            wallets.push(seed);

            storage?.set(`${key}:wallets`, wallets);
            storage?.set(`${address}`, info);
            return info;
        });

        storage?.set("init", "complete");
        router.push("/");
        // setStage({ name: "wallet", level: 0 });
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
                            <Layouts.Col gap={0} align={"center"} fill>
                                <Layouts.Col align={"center"} style={{ padding: "4em" }} fill>
                                    <Layouts.Col gap={4} align={"center"} fit>
                                        <Elements.Text type={"h2"}> Import </Elements.Text>
                                        <Elements.Text weight={"bold"} opacity={0.6}>
                                            Please enter a private key of the wallet that be imported.
                                        </Elements.Text>
                                    </Layouts.Col>
                                </Layouts.Col>
                                <Controls.Input
                                    type={"password"}
                                    placeholder={"Please enter the private key of the wallet to be imported here."}
                                    left={{ children: <Elements.Icon icon={"wallet"} /> }}
                                    style={{ padding: "2em" }}
                                    onChange={(e: any, v: string) => handleImportWallet(v)}
                                />
                                <Controls.Button style={{ margin: "4em", marginTop: "2em" }} onClick={() => setStage({ name: "create", level: 0 })}>
                                    Cancel
                                </Controls.Button>
                            </Layouts.Col>
                        </Layouts.Contents.InnerContent>
                    ),
                },
            ]}
        />
    );
}
