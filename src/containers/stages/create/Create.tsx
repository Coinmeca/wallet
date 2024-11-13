"use client";
import Image from "next/image";
import MECA from "assets/graphics/meca.png";

import { useRouter } from "next/navigation";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider";
import { Stage } from "..";

export default function Create({ setStage }: Stage) {
    const router = useRouter();
    const { provider } = useCoinmecaWalletProvider();

    const handleCreateWallet = () => {
        provider?.create();
        if (provider?.accounts?.length) router.push("/");
    };

    return (
        <Layouts.Contents.SlideContainer
            contents={[
                {
                    active: true,
                    children: (
                        <Layouts.Contents.InnerContent scroll={false}>
                            <Layouts.BG
                                video={{
                                    poster: "",
                                    src: "https://coinmeca.net/img/video/1.mp4",
                                    controls: false,
                                    muted: true,
                                    autoPlay: true,
                                    preload: "auto",
                                    loop: true,
                                }}
                                filter={"black"}
                            />
                            <Layouts.Col align={"center"} style={{ padding: "4em" }} fill>
                                <Layouts.Col align={"center"} style={{ flex: 1 }} fill>
                                    <Layouts.Col gap={4} align={"center"} fit>
                                        <Image src={MECA} width="256" height="256" alt="" />
                                    </Layouts.Col>
                                </Layouts.Col>
                                <Layouts.Col gap={0} style={{ flex: 1 }}>
                                    <Layouts.Col align={"center"} style={{ padding: "4em" }} fill>
                                        <Layouts.Col gap={4} fit>
                                            <Elements.Text type={"h3"}> Setup </Elements.Text>
                                            <Elements.Text weight={"bold"} opacity={0.6}>
                                                Please create a new wallet or import an exist your other wallet via private key.
                                            </Elements.Text>
                                        </Layouts.Col>
                                    </Layouts.Col>
                                    <Layouts.Col gap={4}>
                                        <Controls.Button type={"line"} onClick={() => handleCreateWallet()}>
                                            Create a new wallet
                                        </Controls.Button>
                                        <Controls.Button type={"line"} onClick={() => setStage({ name: "import", level: 0 })}>
                                            Import an exist wallet
                                        </Controls.Button>
                                    </Layouts.Col>
                                </Layouts.Col>
                            </Layouts.Col>
                        </Layouts.Contents.InnerContent>
                    ),
                },
            ]}
        />
    );
}
