"use client";

import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { Stage } from "..";
import { useRouter } from "next/navigation";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { useMessageHandler } from "hooks";

export default function Import({ setStage }: Stage) {
    const router = useRouter();
    const { provider } = useCoinmecaWalletProvider();
    const { count, messages } = useMessageHandler();

    const handleImportWallet = (seed: string) => {
        if (seed.length === 64 && provider?.import(seed)) {
            if (provider?.accounts?.length) router.push(`/${count ? `request/${messages?.[0]?.request?.method}` : ""}`);
        } else new Error("Something wrong while in importing address");
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
                                        <Elements.Text type={"h3"}> Import </Elements.Text>
                                        <Elements.Text weight={"bold"} opacity={0.6}>
                                            Please enter a private key of the wallet that be imported.
                                        </Elements.Text>
                                    </Layouts.Col>
                                </Layouts.Col>
                                <Controls.Input
                                    type={"password"}
                                    placeholder={"Please enter the private key of the wallet to be imported here."}
                                    gap={2}
                                    left={{ children: <Elements.Icon icon={"wallet"} scale={1.25} /> }}
                                    style={{ padding: "2em" }}
                                    onChange={(e: any, v: string) => handleImportWallet(v)}
                                    clearable
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
