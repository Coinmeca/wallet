"use client";

import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { Stages } from "containers";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { useTranslate } from "hooks";
import { bundle as parseBundle } from "utils";

export default function Recover() {
    const router = useRouter();
    const { provider } = useCoinmecaWalletProvider();
    const { t } = useTranslate();

    const bundle = useRef("");
    const secret = useRef("");
    const file = useRef<HTMLInputElement>(null);

    const [stage, setStage] = useState({ name: "form", level: 0 });
    const [data, setData] = useState("");
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const preview = useMemo(() => parseBundle(data.trim()), [data]);

    const handleContinue = () => {
        if (!data || data.trim() === "") return setError(t("recover.error.bundle.required"));
        if (!parseBundle(data.trim())) return setError(t("recover.error.bundle.invalid"));
        if (!code || code.trim() === "") return setError(t("recover.error.secret.required"));

        bundle.current = data.trim();
        secret.current = code;
        setError("");
        setStage({ name: "init", level: 0 });
    };

    const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
        const target = event.target.files?.[0];
        if (!target) return;

        try {
            setData(await target.text());
            setError("");
        } catch {
            setError(t("recover.error.file.read"));
        } finally {
            event.target.value = "";
        }
    };

    const handleRecover = async (passcode: string) => {
        try {
            await provider?.recover(passcode, bundle.current, secret.current);
            bundle.current = "";
            secret.current = "";
            setStage({ name: "complete", level: 0 });
            return true;
        } catch (e) {
            setError((e as any)?.message || t("recover.error.failed"));
            setStage({ name: "failure", level: 0 });
            return false;
        }
    };

    useEffect(() => {
        if (!provider) return;
        if (provider.isInitialized) router.replace("/");
    }, [provider, router]);

    return (
        <Layouts.Contents.SlideContainer
            key="recover"
            contents={[
                {
                    active: stage.name === "form",
                    children: (
                        <Layouts.Contents.InnerContent scroll={false}>
                            <Layouts.Col gap={4} align={"center"} style={{ padding: "4em" }} fill>
                                <Layouts.Col gap={2} align={"center"} fit>
                                    <Elements.Text type={"h3"}>{t("recover.title")}</Elements.Text>
                                    <Elements.Text weight={"bold"} opacity={0.6}>
                                        {t("recover.desc")}
                                    </Elements.Text>
                                </Layouts.Col>
                                <input ref={file} type="file" accept=".json,application/json,text/plain" hidden onChange={handleFile} />
                                <Layouts.Box padding={2} style={{ width: "100%", maxWidth: "48em" }} fit>
                                    <textarea
                                        value={data}
                                        placeholder={t("recover.bundle.placeholder")}
                                        onChange={(e) => setData(e.target.value)}
                                        style={{
                                            width: "100%",
                                            minHeight: "16em",
                                            resize: "vertical",
                                            background: "transparent",
                                            color: "white",
                                            border: 0,
                                            outline: "none",
                                            fontFamily: "monospace",
                                        }}
                                    />
                                </Layouts.Box>
                                <Layouts.Box padding={2} style={{ width: "100%", maxWidth: "48em" }} fit>
                                    <input
                                        type="password"
                                        value={code}
                                        placeholder={t("recover.secret.placeholder")}
                                        onChange={(e) => setCode(e.target.value)}
                                        style={{ width: "100%", background: "transparent", color: "white", border: 0, outline: "none" }}
                                    />
                                </Layouts.Box>
                                {preview?.info && (
                                    <Layouts.Col gap={1} align={"center"} fit>
                                        <Elements.Text weight={"bold"} opacity={0.6}>
                                            {t("recover.preview.created", {
                                                createdAt: preview?.createdAt ? new Date(preview.createdAt).toLocaleString() : "-",
                                            })}
                                        </Elements.Text>
                                        <Elements.Text weight={"bold"} opacity={0.6}>
                                            {t("recover.preview.accounts", {
                                                accounts: `${preview.info.accounts}`,
                                                generated: `${preview.info.generated}`,
                                                imported: `${preview.info.imported}`,
                                            })}
                                        </Elements.Text>
                                    </Layouts.Col>
                                )}
                                {error !== "" && (
                                    <Elements.Text color={"red"} weight={"bold"}>
                                        {error}
                                    </Elements.Text>
                                )}
                                <Layouts.Row gap={2}>
                                    <Controls.Button type={"glass"} onClick={() => file.current?.click()}>
                                        {t("recover.btn.load.file")}
                                    </Controls.Button>
                                    <Controls.Button onClick={handleContinue}>{t("recover.btn.continue")}</Controls.Button>
                                    <Controls.Button type={"glass"} onClick={() => router.push("/welcome")}>
                                        {t("app.btn.cancel")}
                                    </Controls.Button>
                                </Layouts.Row>
                            </Layouts.Col>
                        </Layouts.Contents.InnerContent>
                    ),
                },
                {
                    active: stage.name === "init",
                    children: <Stages.Init stage={stage} setStage={setStage} exit={"form"} onConfirm={handleRecover} />,
                },
                {
                    active: stage.name === "complete",
                    children: (
                        <Layouts.Contents.InnerContent scroll={false}>
                            <Layouts.Col gap={4} align={"center"} style={{ padding: "4em" }} fill>
                                <Elements.Text type={"h3"}>{t("app.state.complete")}</Elements.Text>
                                <Elements.Text weight={"bold"} opacity={0.6}>
                                    {t("recover.complete.desc")}
                                </Elements.Text>
                                <Controls.Button onClick={() => router.push("/")}>{t("app.btn.go.main")}</Controls.Button>
                            </Layouts.Col>
                        </Layouts.Contents.InnerContent>
                    ),
                },
                {
                    active: stage.name === "failure",
                    children: (
                        <Layouts.Contents.InnerContent scroll={false}>
                            <Layouts.Col gap={4} align={"center"} style={{ padding: "4em" }} fill>
                                <Elements.Text type={"h3"}>{t("app.state.failure")}</Elements.Text>
                                <Elements.Text weight={"bold"} color={"red"}>
                                    {error || t("recover.error.failed")}
                                </Elements.Text>
                                <Layouts.Row gap={2}>
                                    <Controls.Button onClick={() => setStage({ name: "form", level: 0 })}>{t("app.btn.try.again")}</Controls.Button>
                                    <Controls.Button type={"glass"} onClick={() => router.push("/welcome")}>
                                        {t("recover.btn.welcome")}
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
