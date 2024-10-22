"use client";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { useTelegram } from "hooks";
import { wallet } from "wallet";

interface Stage {
    stage: { name: string; level: number };
    setStage: Function;
    setAccount: Function;
}

export default function Create({ setStage, setAccount }: Stage) {
    const { telegram, user } = useTelegram();

    const handleCreateWallet = () => {
        const key = sessionStorage.getItem("key");
        // error
        if (!key || key === "") return;

        const storage = telegram && user?.id ? telegram.CloudStorage : localStorage;
        let wallets: any = storage.getItem(`${key}:wallets`);

        if (!wallets) wallets = [];
        else wallets = JSON.parse(wallets);

        setAccount(() => {
            let info: any;
            const { privateKey, address } = wallet().create(`${key}:${wallets.length}`);
            if (wallets.find((w: string) => w?.toLowerCase() === privateKey?.toLowerCase())) {
                info = storage.getItem(`${address}`);
                if (info) return JSON.parse(info);
            } else {
                info = { name: `Wallet ${wallets.length}`, address };
                wallets.push(privateKey);
                storage.setItem(`${key}:wallets`, JSON.stringify(wallets));
                storage.setItem(`${address}`, JSON.stringify(info));
                return info;
            }
        });

        storage.setItem("init", "complete");
        console.log("wallets", wallets);
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
                                <Controls.Button type={"line"} onClick={() => setStage({ stage: "import", level: 0 })}>
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
