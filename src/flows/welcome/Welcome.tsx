"use client";

import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { useTelegram, useAccount } from "hooks";
import { useCallback, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Stages } from "containers";

export default function Welcome() {
    const router = useRouter();
    const path = usePathname();

    const { telegram, user } = useTelegram();
    const { account, setAccount } = useAccount();

    const [level, setLevel] = useState<number>(0);
    const [init, setInit] = useState(false);

    const [stage, setStage] = useState({ name: "", level: 0 });

    return (
        <Layouts.Contents.SlideContainer
            contents={[
                {
                    active: stage.name === "",
                    children: <Stages.Welcome stage={stage} setStage={setStage} />,
                },
                {
                    active: stage.name === "init",
                    children: <Stages.Init stage={stage} setStage={setStage} />,
                },
                {
                    active: stage.name === "create",
                    children: <Stages.Create stage={stage} setStage={setStage} setAccount={setAccount} />,
                },
                {
                    active: stage.name === "import",
                    children: <Stages.Import stage={stage} setStage={setStage} setAccount={setAccount} />,
                },
                {
                    active: stage.name === "wallet",
                    children: (
                        <Layouts.Contents.SlideContainer
                            contents={[
                                {
                                    active: true,
                                    children: (
                                        <Layouts.Contents.InnerContent scroll={false}>
                                            <Layouts.Col align={"center"} style={{ padding: "4em" }} fill>
                                                <Layouts.Col gap={4} align={"center"} fit>
                                                    <Elements.Text type={"h6"} opacity={0.6}>
                                                        {account?.name}
                                                    </Elements.Text>
                                                    <Elements.Icon
                                                        icon={"wallet"}
                                                        scale={3}
                                                        style={{ padding: "0.5em", borderRadius: "4em", background: "rgba(var(--white),.15)" }}
                                                    />
                                                    <Elements.Text type={"h6"}>
                                                        {account?.address &&
                                                            `${account.address.substring(
                                                                0,
                                                                account.address.startsWith("0x") ? 6 : 4,
                                                            )} ... ${account.address.substring(account.address.length - 4, account.address.length)}`}
                                                    </Elements.Text>
                                                </Layouts.Col>
                                            </Layouts.Col>
                                            <Layouts.Col gap={0} align={"center"} fill>
                                                <Layouts.Col align={"center"} style={{ padding: "4em" }} fill>
                                                    <Layouts.Col gap={4} align={"center"} fit>
                                                        {" "}
                                                    </Layouts.Col>
                                                    <Controls.Button style={{ margin: "4em", marginTop: "2em" }}> Cancel </Controls.Button>
                                                </Layouts.Col>
                                            </Layouts.Col>
                                        </Layouts.Contents.InnerContent>
                                    ),
                                },
                            ]}
                        />
                    ),
                },
            ]}
        />
    );
}
