"use client";

import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { useNotification } from "@coinmeca/ui/hooks";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Stages } from "containers";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { useTranslate } from "hooks";
import { bundle as parseBundle } from "utils";

export default function Backup() {
    const router = useRouter();
    const { provider } = useCoinmecaWalletProvider();
    const { addToast } = useNotification();
    const { t } = useTranslate();

    const [stage, setStage] = useState("lock");
    const [bundle, setBundle] = useState("");
    const [secret, setSecret] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const preview = parseBundle(bundle);

    const handleUnlock = async (code: string) => {
        try {
            if (await provider?.unlock(code)) {
                setStage("form");
                return true;
            }
        } catch (e) {
            setError((e as any)?.message || t("lock.error.wrong"));
        }
        return false;
    };

    const handleExport = async () => {
        if (!secret || !confirm) return setError(t("backup.error.secret.required"));
        if (secret !== confirm) return setError(t("backup.error.secret.mismatch"));
        if (secret.length < 8) return setError(t("backup.error.secret.short"));

        try {
            const nextBundle = (await provider?.backup(secret)) || "";
            if (!nextBundle) throw new Error(t("backup.error.bundle.create"));
            setBundle(nextBundle);
            setError("");
            setStage("complete");
        } catch (e) {
            setError((e as any)?.message || t("backup.error.bundle.failed"));
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(bundle);
            addToast({
                title: t("backup.title"),
                message: t("backup.toast.copy.success"),
            });
        } catch {
            addToast({
                title: t("backup.title"),
                message: t("backup.toast.copy.failure"),
            });
        }
    };

    const handleDownload = () => {
        if (!bundle) return;

        const blob = new Blob([bundle], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "coinmeca-wallet-backup.json";
        link.click();

        URL.revokeObjectURL(url);
    };

    useEffect(() => {
        if (!provider) return;
        if (!provider.isInitialized) router.replace("/welcome");
    }, [provider, router]);

    return (
        <Layouts.Contents.SlideContainer
            key="backup"
            contents={[
                {
                    active: stage === "lock",
                    children: <Stages.Lock onUnlock={handleUnlock} />,
                },
                {
                    active: stage === "form",
                    children: (
                        <Layouts.Contents.InnerContent scroll={false}>
                            <Layouts.Col gap={4} align={"center"} style={{ padding: "4em" }} fill>
                                <Layouts.Col gap={2} align={"center"} fit>
                                    <Elements.Text type={"h3"}>{t("backup.title")}</Elements.Text>
                                    <Elements.Text weight={"bold"} opacity={0.6}>
                                        {t("backup.desc")}
                                    </Elements.Text>
                                </Layouts.Col>
                                <Layouts.Col gap={2} style={{ width: "100%", maxWidth: "48em" }}>
                                    <Layouts.Box padding={2} fit>
                                        <input
                                            type="password"
                                            value={secret}
                                            placeholder={t("backup.secret.placeholder")}
                                            onChange={(e) => setSecret(e.target.value)}
                                            style={{ width: "100%", background: "transparent", color: "white", border: 0, outline: "none" }}
                                        />
                                    </Layouts.Box>
                                    <Layouts.Box padding={2} fit>
                                        <input
                                            type="password"
                                            value={confirm}
                                            placeholder={t("backup.secret.confirm.placeholder")}
                                            onChange={(e) => setConfirm(e.target.value)}
                                            style={{ width: "100%", background: "transparent", color: "white", border: 0, outline: "none" }}
                                        />
                                    </Layouts.Box>
                                    {error !== "" && (
                                        <Elements.Text color={"red"} weight={"bold"}>
                                            {error}
                                        </Elements.Text>
                                    )}
                                </Layouts.Col>
                                <Layouts.Col gap={2} style={{ width: "100%", maxWidth: "48em" }}>
                                    <Controls.Button onClick={handleExport}>{t("backup.btn.create")}</Controls.Button>
                                    <Controls.Button type={"glass"} onClick={() => router.push("/")}>
                                        {t("app.btn.cancel")}
                                    </Controls.Button>
                                </Layouts.Col>
                            </Layouts.Col>
                        </Layouts.Contents.InnerContent>
                    ),
                },
                {
                    active: stage === "complete",
                    children: (
                        <Layouts.Contents.InnerContent scroll={false}>
                            <Layouts.Col gap={4} align={"center"} style={{ padding: "4em" }} fill>
                                <Layouts.Col gap={2} align={"center"} fit>
                                    <Elements.Text type={"h3"}>{t("backup.ready.title")}</Elements.Text>
                                    <Elements.Text weight={"bold"} opacity={0.6}>
                                        {t("backup.ready.desc")}
                                    </Elements.Text>
                                </Layouts.Col>
                                <Layouts.Box padding={2} style={{ width: "100%", maxWidth: "48em" }} fit>
                                    <textarea
                                        readOnly
                                        value={bundle}
                                        style={{
                                            width: "100%",
                                            minHeight: "18em",
                                            resize: "vertical",
                                            background: "transparent",
                                            color: "white",
                                            border: 0,
                                            outline: "none",
                                            fontFamily: "monospace",
                                        }}
                                    />
                                </Layouts.Box>
                                {preview?.info && (
                                    <Layouts.Col gap={1} align={"center"} fit>
                                        <Elements.Text weight={"bold"} opacity={0.6}>
                                            {t("backup.preview.created", {
                                                createdAt: preview?.createdAt ? new Date(preview.createdAt).toLocaleString() : "-",
                                            })}
                                        </Elements.Text>
                                        <Elements.Text weight={"bold"} opacity={0.6}>
                                            {t("backup.preview.accounts", {
                                                accounts: `${preview.info.accounts}`,
                                                generated: `${preview.info.generated}`,
                                                imported: `${preview.info.imported}`,
                                            })}
                                        </Elements.Text>
                                    </Layouts.Col>
                                )}
                                <Layouts.Row gap={2}>
                                    <Controls.Button onClick={handleCopy}>{t("backup.btn.copy")}</Controls.Button>
                                    <Controls.Button onClick={handleDownload}>{t("backup.btn.download")}</Controls.Button>
                                    <Controls.Button type={"glass"} onClick={() => router.push("/")}>
                                        {t("app.btn.go.main")}
                                    </Controls.Button>
                                </Layouts.Row>
                            </Layouts.Col>
                        </Layouts.Contents.InnerContent>
                    ),
                },
            ]}
        />
    );
}
