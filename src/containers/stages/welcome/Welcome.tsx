"use client";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { useRouter } from "next/navigation";
import { Stage } from "..";
import { useTranslate } from "hooks";
import { video } from "utils";

export default function Welcome({ setStage }: Stage) {
    const router = useRouter();
    const { t } = useTranslate();

    return (
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
                    <Layouts.Col gap={2} align={"center"} style={{ padding: "4em" }} fill>
                        <Layouts.Col align={"center"} fill>
                            <Layouts.Col gap={4} align={"center"} fit>
                        <Elements.Text type={"h2"}>{t("welcome.title")}</Elements.Text>
                        <Elements.Text>{t("welcome.desc")}</Elements.Text>
                            </Layouts.Col>
                        </Layouts.Col>
                        <Layouts.Col gap={4} align={"center"} style={{ margin: 0 }}>
                            <Controls.Button type={"line"} onClick={() => setStage({ name: "init", level: 0 })}>
                        {t("welcome.btn.start")}
                            </Controls.Button>
                            <Controls.Button type={"glass"} onClick={() => router.push("/recover")}>
                        {t("welcome.btn.recover")}
                            </Controls.Button>
                        </Layouts.Col>
                    </Layouts.Col>
        </Layouts.Contents.InnerContent>
    );
}
