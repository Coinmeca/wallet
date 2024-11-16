"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useState } from "react";

import { Contents, Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { useMessageHandler, useTelegram } from "hooks";

/*
await window.ethereum.providerMap.get("CoinmecaWallet").request({method: 'eth_accounts'})
*/

const method = "eth_accounts";

export default function Page() {
    const router = useRouter();

    const { telegram } = useTelegram();
    const { provider } = useCoinmecaWalletProvider();
    const { app, isPopup } = useMessageHandler();

    const handleClose = () => {
        if (isPopup) {
            if (telegram) telegram?.close();
            window?.close();
        } else router.push("/");
    };

    useLayoutEffect(() => {
        window?.opener?.postMessage(
            {
                method,
                result: provider?.accounts(app?.url),
            },
            "*",
        );
        handleClose();
    }, []);

    return <Contents.States.Loading style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 10000, background: "black" }} />;
}
