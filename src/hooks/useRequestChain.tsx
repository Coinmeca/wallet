"use client";

import { useMemo } from "react";
import { parseChainId } from "@coinmeca/wallet-provider/chains";
import { valid } from "@coinmeca/wallet-sdk/utils";

export function useRequestChain(provider: any, chainId?: any) {
    const activeChainId = useMemo(() => {
        const current = provider?.chainId;
        return typeof current !== "undefined" && valid.chainId(current) ? parseChainId(current) : undefined;
    }, [provider?.chainId]);

    const activeChain = useMemo(
        () =>
            typeof activeChainId === "number"
                ? provider?.chains?.find((item: any) => typeof item?.chainId !== "undefined" && parseChainId(item.chainId) === activeChainId)
                : undefined,
        [activeChainId, provider?.chains],
    );

    const requestedChainId = useMemo(() => {
        return typeof chainId !== "undefined" && valid.chainId(chainId) ? parseChainId(chainId) : undefined;
    }, [chainId]);

    const requestChain = useMemo(
        () =>
            typeof requestedChainId === "number"
                ? provider?.chains?.find((item: any) => typeof item?.chainId !== "undefined" && parseChainId(item.chainId) === requestedChainId)
                : activeChain,
        [activeChain, provider?.chains, requestedChainId],
    );

    return {
        activeChainId,
        activeChain,
        requestedChainId,
        requestChain,
    };
}
