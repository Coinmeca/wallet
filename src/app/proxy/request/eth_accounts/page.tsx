"use client";

import { useLayoutEffect, useState } from "react";

import { Contents } from "@coinmeca/ui/components";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { useMessageHandler } from "hooks";

/*
await window.ethereum.providerMap.get("CoinmecaWallet").request({method: 'eth_accounts'})
*/

const method = "eth_accounts";

export default function Page() {
    const { provider } = useCoinmecaWalletProvider();
    const { app, messageId } = useMessageHandler();

    useLayoutEffect(() => {
        if (provider && messageId) {
            window?.parent?.postMessage(
                {
                    method,
                    result: provider?.accounts(app?.url) || [],
                    id: messageId,
                },
                "*",
            );
            const iframe = window?.parent?.document?.getElementById(`coinmeca-wallet-proxy-${messageId}`);
            if (iframe) iframe.remove();
        }
    }, [provider, messageId]);

    return <Contents.States.Loading style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 10000, background: "black" }} />;
}
