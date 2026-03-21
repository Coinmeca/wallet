"use client";

import { useLayoutEffect, useState } from "react";
import { Contents } from "@coinmeca/ui/components";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";

import { MessageProps, useMessageHandler } from "contexts/message";

/*
await window.ethereum.providerMap.get("CoinmecaWallet").request({method: 'eth_accounts'})
*/

const method = "eth_accounts";

export default function Page() {
    const { provider } = useCoinmecaWalletProvider();
    const { getRequest, success, messages } = useMessageHandler();
    const [request, setRequest] = useState<MessageProps>();

    useLayoutEffect(() => {
        if (!request?.id) setRequest(getRequest(method));
    }, [getRequest, messages, request?.id]);

    useLayoutEffect(() => {
        if (provider && request?.id) success(request.id, provider?.accounts(request?.request?.app?.url) || []);
    }, [provider, request, success]);

    return <Contents.States.Loading style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: -10000, background: "black" }} />;
}
