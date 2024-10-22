"use client";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { Stage } from "..";

export default function Welcome({ setStage }: Stage) {
    return (
        <Layouts.Contents.InnerContent scroll={false}>
            <Layouts.Col gap={2} align={"center"} style={{ padding: "4em" }} fill>
                <Layouts.Col align={"center"} fill>
                    <Layouts.Col gap={4} align={"center"} fit>
                        <Elements.Text type={"h2"}> Welcome </Elements.Text>
                        <Elements.Text>
                            For smooth use, please set a password first.If it has been lost, it is impossible to use or recover all created wallets on this
                            passcode, so please enter it carefully.
                        </Elements.Text>
                    </Layouts.Col>
                </Layouts.Col>
                <Layouts.Col gap={4} align={"center"} style={{ margin: 0 }}>
                    <Controls.Button type={"line"} onClick={() => setStage({ name: "init", level: 0 })}>
                        Get Started
                    </Controls.Button>
                </Layouts.Col>
            </Layouts.Col>
        </Layouts.Contents.InnerContent>
    );
}
