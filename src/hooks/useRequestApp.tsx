"use client";

import { useMemo } from "react";
import { App } from "@coinmeca/wallet-sdk/types";

import { site } from "utils";

export function useRequestApp(app?: App, fallback?: string) {
    const info = useMemo(() => site(app?.url), [app?.url]);
    const title = app?.name || info?.host || info?.origin || fallback || "";
    const origin = info?.origin || app?.url || "";

    return {
        info,
        title,
        origin,
    };
}
