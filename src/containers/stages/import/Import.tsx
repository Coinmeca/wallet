"use client";

import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { Stage } from "..";
import { useRouter } from "next/navigation";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { useMessageHandler, useTranslate } from "hooks";
import { useNotification } from "@coinmeca/ui/hooks";
import { useEffect, useMemo, useState } from "react";
import { requestRoute } from "utils";

export default function Import({ stage, setStage }: Stage) {
    const router = useRouter();
    const { provider, account, accounts } = useCoinmecaWalletProvider();
    const { count, messages } = useMessageHandler();
    const { addToast } = useNotification();
    const { t } = useTranslate();

    const [mount, setMount] = useState(false);
    const [error, setError] = useState<{ state?: boolean; message?: string }>();
    const [loading, setLoading] = useState(false);
    const [check, setCheck] = useState(false);
    const nextRoute = useMemo(() => (count ? requestRoute(messages?.[0]?.request?.method) || "/" : "/"), [count, messages]);
    const hasAccount = !!account || !!accounts?.length || !!provider?.account() || !!provider?.accounts()?.length;

    useEffect(() => {
        void router.prefetch(nextRoute);
    }, [nextRoute, router]);

    useEffect(() => {
        if (!loading || !hasAccount) return;
        router.replace(nextRoute);
    }, [hasAccount, loading, nextRoute, router]);

    const handleImportWallet = async (seed: string) => {
        seed = seed.startsWith("0x") ? seed.slice(2) : seed;
        let error: any = { state: false };
        if (!seed || seed.trim() === "") return setError(error);
        if (seed.length < 64) error = { state: true, message: t("import.error.seed.short") };
        if (seed.length > 64) error = { state: true, message: t("import.error.seed.long") };
        if (!/^[0-9a-fA-F]{64}$/.test(seed)) error = { state: true, message: t("import.error.seed.format") };
        if (error.state) setError(error);
        else {
            setLoading(true);
            try {
                if (await provider?.import(seed)) {
                    setCheck(true);
                    router.replace(nextRoute);
                } else addToast({ title: t("import.account.title"), message: t("import.account.exists") });
            } catch (error) {
                addToast({ title: t("import.account.title"), message: t("import.account.invalid") });
            }
            setLoading(false);
        }
    };

    useEffect(() => {
        stage.name === "import"
            ? setTimeout(() => {
                  setMount(true);
              }, 300)
            : setMount(false);
    }, [stage.name]);

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
                                        <Elements.Text type={"h3"}>{t("import.title")}</Elements.Text>
                                        <Elements.Text weight={"bold"} opacity={0.6} color={error?.state && "red"}>
                                            {error?.state ? error.message : t("import.desc")}
                                        </Elements.Text>
                                    </Layouts.Col>
                                </Layouts.Col>
                                <Controls.Input
                                    type={"password"}
                                    placeholder={t("import.placeholder")}
                                    gap={2}
                                    left={{
                                        children: (
                                            <Elements.Icon icon={loading ? (check ? "check" : "loading") : "wallet"} scale={1.25} color={check && "green"} />
                                        ),
                                    }}
                                    style={{ padding: "2em clamp(2em, 5%, 8em)", minHeight: "4em" }}
                                    onChange={(e: any, v: string) => handleImportWallet(v)}
                                    error={error?.state}
                                    autoFocus={mount}
                                    clearable
                                />
                                <Controls.Button style={{ margin: "4em", marginTop: "2em" }} onClick={() => setStage({ name: "create", level: 0 })}>
                                    {t("app.btn.cancel")}
                                </Controls.Button>
                            </Layouts.Col>
                        </Layouts.Contents.InnerContent>
                    ),
                },
            ]}
        />
    );
}
