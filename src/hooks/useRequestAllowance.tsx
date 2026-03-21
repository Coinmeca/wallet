"use client";

import { useMemo } from "react";
import { App } from "@coinmeca/wallet-sdk/types";

export function useRequestAllowance(
    provider?: { assertAllowance?: (app: App | string, address?: string) => any },
    app?: App,
    address?: string,
    enabled = true,
): { auth: boolean; authError: any } {
    return useMemo(() => {
        if (!enabled || !app) return { auth: false, authError: undefined };
        if (!provider?.assertAllowance) return { auth: false, authError: new Error("Wallet provider is unavailable.") };

        try {
            provider.assertAllowance(app, address);
            return { auth: true, authError: undefined };
        } catch (authError) {
            return { auth: false, authError };
        }
    }, [address, app, enabled, provider]);
}
