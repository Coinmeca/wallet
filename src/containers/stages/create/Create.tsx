"use client";

import Image from "next/image";
import MECA from "assets/graphics/meca.png";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { Stage } from "..";
import { useMessageHandler, useTranslate } from "hooks";
import { requestRoute, video } from "utils";

export default function Create({ setStage }: Stage) {
    const router = useRouter();
    const { provider, account, accounts } = useCoinmecaWalletProvider();
    const { count, messages } = useMessageHandler();
    const { t } = useTranslate();
    const [loading, setLoading] = useState(false);
    const creatingRef = useRef(false);
    const nextRoute = useMemo(() => (count ? requestRoute(messages?.[0]?.request?.method) || "/" : "/"), [count, messages]);
    const hasAccount = !!account || !!accounts?.length || !!provider?.account() || !!provider?.accounts()?.length;

    useEffect(() => {
        void router.prefetch(nextRoute);
    }, [nextRoute, router]);

    useEffect(() => {
        if (!loading || !hasAccount) return;
        router.replace(nextRoute);
    }, [hasAccount, loading, nextRoute, router]);

    const handleCreateWallet = async () => {
        if (creatingRef.current || loading) return;

        creatingRef.current = true;
        setLoading(true);

        try {
            await provider?.create();
            if (provider?.account() || provider?.accounts()?.length) {
                router.replace(nextRoute);
            }
        } catch (error) {
            creatingRef.current = false;
            setLoading(false);
            throw error;
        }
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
                                    src: video(),
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
                                            <Elements.Text type={"h3"}>{t("create.title")}</Elements.Text>
                                            <Elements.Text weight={"bold"} opacity={0.6}>
                                                {t("create.desc")}
                                            </Elements.Text>
                                            {loading && (
                                                <Elements.Text weight={"bold"} opacity={0.6}>
                                                    {t("create.loading")}
                                                </Elements.Text>
                                            )}
                                        </Layouts.Col>
                                    </Layouts.Col>
                                    <Layouts.Col gap={4}>
                                        <Controls.Button type={"line"} disabled={loading} onClick={() => handleCreateWallet()}>
                                            {t("create.btn.new")}
                                        </Controls.Button>
                                        <Controls.Button type={"line"} disabled={loading} onClick={() => setStage({ name: "import", level: 0 })}>
                                            {t("create.btn.import")}
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
