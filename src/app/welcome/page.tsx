"use client";

import CryptoJS from "crypto-js";
import { useLayoutEffect, useState } from "react";
import { Layouts } from "@coinmeca/ui/components";

import { getChainsByType } from "@coinmeca/wallet-sdk/chains";
import { format, parse } from "@coinmeca/wallet-sdk/utils";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { Stages } from "containers";

export default function Welcome() {
    const { provider } = useCoinmecaWalletProvider();
    const [stage, setStage] = useState({ name: "welcome", level: 0 });

    useLayoutEffect(() => {
        if (provider?.isInitialized) setStage({ name: "create", level: 0 });
    }, [provider]);

    const handleConfirm = (passcode: string) => {
        provider?.init(CryptoJS.SHA256(passcode).toString());
        const chains = format(getChainsByType("mainnet"));
        if (chains) localStorage.setItem("coinmeca:wallet:chains", chains);
        return true;
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
                //                                         {account?.address &&
                //                                             `${account.address.substring(
                //                                                 0,
                //                                                 account.address.startsWith("0x") ? 6 : 4,
                //                                             )} ... ${account.address.substring(account.address.length - 4, account.address.length)}`}
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
