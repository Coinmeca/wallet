"use client";

import { useLayoutEffect, useState } from "react";
import { Layouts } from "@coinmeca/ui/components";

import { getChainsByType } from "@coinmeca/wallet-provider/chains";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { Stages } from "containers";
import { Chain } from "@coinmeca/wallet-sdk/types";
import { sort } from "@coinmeca/ui/lib/utils";

export default function Welcome() {
    const { provider } = useCoinmecaWalletProvider();
    const [stage, setStage] = useState({ name: "welcome", level: 0 });

    useLayoutEffect(() => {
        if (provider?.isInitialized) setStage({ name: "create", level: 0 });
    }, [provider]);

    const handleConfirm = (passcode: string) => {
        try {
            getChainsByType("mainnet")
                ?.reverse()
                ?.map((chain: Chain) => provider?.updateChain(chain));
            console.log({ passcode });
            provider?.init(passcode);
            setStage({ name: "create", level: 2 });
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    return (
        <Layouts.Contents.SlideContainer
            key="welcome"
            contents={[
                {
                    active: stage.name === "welcome",
                    children: <Stages.Welcome stage={stage} setStage={setStage} />,
                },
                {
                    active: stage.name === "init",
                    children: <Stages.Init stage={stage} setStage={setStage} exit={"welcome"} onConfirm={handleConfirm} />,
                },
                // {
                //     active: stage.level === 2,
                //     children: (
                //         <Layouts.Contents.SlideContainer
                //             contents={[
                //                 {
                //                     active: true,
                //                     children: (
                //                         <Layouts.Contents.InnerContent scroll={false}>
                //                             <Layouts.Col align={"center"} style={{ padding: "4em" }} fill>
                //                                 <Layouts.Col gap={4} align={"center"} fit>
                //                                     <Elements.Text type={"h6"} opacity={0.6}>
                //                                     BIOMETRIC
                //                                     </Elements.Text>
                //                                     <Elements.Icon
                //                                         icon={"wallet"}
                //                                         scale={3}
                //                                         style={{ padding: "0.5em", borderRadius: "4em", background: "rgba(var(--white),.15)" }}
                //                                     />
                //                                     <Elements.Text type={"h6"}>
                //                                         test
                //                                     </Elements.Text>
                //                                 </Layouts.Col>
                //                             </Layouts.Col>
                //                             <Layouts.Col gap={0} align={"center"} fill>
                //                                 <Layouts.Col align={"center"} style={{ padding: "4em" }} fill>
                //                                     <Layouts.Col gap={4} align={"center"} fit>
                //                                         {" "}
                //                                     </Layouts.Col>
                //                                     <Controls.Button style={{ margin: "4em", marginTop: "2em" }}>YES</Controls.Button>
                //                                     <Controls.Button style={{ margin: "4em", marginTop: "2em" }}>NO</Controls.Button>
                //                                 </Layouts.Col>
                //                             </Layouts.Col>
                //                         </Layouts.Contents.InnerContent>
                //                     ),
                //                 },
                //             ]}
                //         />
                //     ),
                // },
                {
                    active: stage.name === "create",
                    children: <Stages.Create stage={stage} setStage={setStage} />,
                },
                {
                    active: stage.name === "import",
                    children: <Stages.Import stage={stage} setStage={setStage} />,
                },
                // {
                //     active: stage.name === "wallet",
                //     children: (
                //         <Layouts.Contents.SlideContainer
                //             contents={[
                //                 {
                //                     active: true,
                //                     children: (
                //                         <Layouts.Contents.InnerContent scroll={false}>
                //                             <Layouts.Col align={"center"} style={{ padding: "4em" }} fill>
                //                                 <Layouts.Col gap={4} align={"center"} fit>
                //                                     <Elements.Text type={"h6"} opacity={0.6}>
                //                                         {account?.name}
                //                                     </Elements.Text>
                //                                     <Elements.Icon
                //                                         icon={"wallet"}
                //                                         scale={3}
                //                                         style={{ padding: "0.5em", borderRadius: "4em", background: "rgba(var(--white),.15)" }}
                //                                     />
                //                                     <Elements.Text type={"h6"}>
                //                                         {short(account?.address)}
                //                                     </Elements.Text>
                //                                 </Layouts.Col>
                //                             </Layouts.Col>
                //                             <Layouts.Col gap={0} align={"center"} fill>
                //                                 <Layouts.Col align={"center"} style={{ padding: "4em" }} fill>
                //                                     <Layouts.Col gap={4} align={"center"} fit>
                //                                         {" "}
                //                                     </Layouts.Col>
                //                                     <Controls.Button style={{ margin: "4em", marginTop: "2em" }}> Cancel </Controls.Button>
                //                                 </Layouts.Col>
                //                             </Layouts.Col>
                //                         </Layouts.Contents.InnerContent>
                //                     ),
                //                 },
                //             ]}
                //         />
                //     ),
                // },
            ]}
        />
    );
}
