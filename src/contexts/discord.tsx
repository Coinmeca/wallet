"use client";

import React, { createContext, useContext, useLayoutEffect, useRef, useState } from "react";
import { DiscordSDK } from "@discord/embedded-app-sdk";
import { usePathname } from "next/navigation";

interface DiscordContextProps {
    isReady: boolean;
    isDiscord: boolean;
    discord: DiscordSDK | null;
    platform?: string;
}

interface DiscordEnvironment {
    channel_id: string;
    custom_id: string;
    frame_id: string;
    instance_id: string;
    launch_id: string;
    location_id: string;
    platform: string;
    referrer_id: string;
}

const DiscordContext = createContext<DiscordContextProps | undefined>(undefined);

export const useDiscord = () => {
    const context = useContext(DiscordContext);
    if (!context) throw new Error("DiscordContext is not initialized yet. Ensure the provider is correctly set up.");
    return context;
};

export const DiscordProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    const pathname = usePathname();

    const [discord, setDiscord] = useState<DiscordSDK | null>(null);
    const [isReady, setReady] = useState(false);
    const [isDiscord, setIsDiscord] = useState(false);
    const [environment, setEnvironment] = useState<Partial<DiscordEnvironment> | undefined>();
    const search = useRef<string>("");

    useLayoutEffect(() => {
        const discord = typeof window !== "undefined" && (window.location.search.includes("frame_id") || window.location.hostname.endsWith("discordsays.com"));

        setIsDiscord(discord);
        if (!discord) return;
        if (window.location.search && !sessionStorage.getItem("discordSearchParams")) sessionStorage.setItem("discordSearchParams", window.location.search);
        setEnvironment(Object.fromEntries(new URLSearchParams(window.location.search).entries()));

        const originalFetch = window.fetch;
        window.fetch = async (input, init = {}) => {
            try {
                let url = "";
                let method = init.method || "GET";

                if (typeof input === "string") url = input;
                else if (input instanceof Request) {
                    url = input.url;
                    method = input.method;
                    init = {
                        method: input.method,
                        headers: Object.fromEntries(input.headers.entries()),
                        body: input.method !== "GET" && input.method !== "HEAD" ? await input.clone().text() : undefined,
                        credentials: input.credentials,
                    };
                } else return originalFetch(input, init);

                if (!url.startsWith("/")) {
                    console.log("Proxying:", url);

                    if (method === "GET" || method === "HEAD") {
                        const encoded = encodeURIComponent(url);
                        console.log("Call:", `/.proxy/api/proxy?url=${encoded}`);
                        return originalFetch(`/.proxy/api/proxy?url=${encoded}`, init);
                    } else {
                        const headers = init.headers || {};
                        const bodyText = init.body;
                        let payload;
                        if (typeof bodyText === "string")
                            try {
                                payload = JSON.parse(bodyText);
                            } catch {
                                payload = bodyText;
                            }
                        else if (bodyText instanceof URLSearchParams) payload = Object.fromEntries(bodyText.entries());
                        else payload = bodyText;
                        return originalFetch("/.proxy/api/proxy", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                url,
                                headers,
                                payload,
                            }),
                        });
                    }
                }

                return originalFetch(input, init);
            } catch (error) {
                console.error("Custom fetch proxy error:", error);
                throw error;
            }
        };

        const sdk = new DiscordSDK(process.env.DISCORD_CLIENT_ID!);
        setDiscord(sdk);

        (async () => {
            await sdk.ready();

            const { code } = await sdk.commands.authorize({
                client_id: process.env.DISCORD_CLIENT_ID!,
                response_type: "code",
                state: "",
                prompt: "none",
                scope: ["identify", "guilds", "applications.commands"],
            });

            const res = await fetch("/api/discord", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code }),
            });

            const { access_token } = await res.json();

            const auth = await sdk.commands.authenticate({ access_token });
            if (!auth) {
                console.error("Authentication failed:", access_token);
                throw new Error("Authentication failed");
            }

            setReady(true);
        })().catch(console.error);
    }, []);

    useLayoutEffect(() => {
        if (!discord) return;

        const current = new URLSearchParams(window.location.search);
        const stored = new URLSearchParams(sessionStorage.getItem("discordSearchParams") || "");

        stored.forEach((value, key) => {
            if (!current.has(key)) current.set(key, value);
        });

        const newSearch = current.toString() ? "?" + current.toString() : "";

        if (window.location.search !== newSearch && search.current !== newSearch) {
            const newUrl = window.location.pathname + newSearch + window.location.hash;
            window.history.replaceState(null, "", newUrl);
            search.current = newSearch;
        }
    }, [pathname, discord]);

    return <DiscordContext.Provider value={{ isReady, isDiscord, discord, platform: environment?.platform }}>{children}</DiscordContext.Provider>;
};
