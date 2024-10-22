"use client";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { useTelegram } from "hooks";
import { wallet } from "wallet";

interface Stage {
    stage: { name: string; level: number };
    setStage: Function;
    setAccount: Function;
}

export default function Import({ setStage, setAccount }: Stage) {
    const { telegram, user } = useTelegram();

    const handleImportWallet = (seed: string) => {
        // error
        if (seed.length !== 64) return;

        const key = sessionStorage.getItem("key");
        // error
        if (!key || key === "") return;

        const address = wallet(seed).address;
        // error
        if (!address) return;
        console.log(address);

        const storage = telegram && user?.id ? telegram.CloudStorage : localStorage;
        let wallets: any = storage.getItem(`${key}:wallets`);

        if (!wallets) wallets = [];
        else wallets = JSON.parse(wallets?.toString());

        setAccount(() => {
            let info: any;
            if (wallets.find((w: string) => w?.toLowerCase() === seed?.toLowerCase())) {
                info = storage.getItem(`${address}`);
                if (info) return JSON.parse(info);
            } else {
                info = { name: `Wallet ${wallets.length}`, address };
                wallets.push(seed);
                storage.setItem(`${key}:wallets`, JSON.stringify(wallets));
                storage.setItem(`${address}`, JSON.stringify(info));
                return info;
            }
        });

        storage.setItem("init", "complete");
        setStage({ stage: "wallet", level: 0 });
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
                                <Controls.Button style={{ margin: "4em", marginTop: "2em" }} onClick={() => setStage("setup")}>
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
