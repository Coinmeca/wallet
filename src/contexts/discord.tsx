"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { DiscordSDK } from "@discord/embedded-app-sdk";

interface DiscordContextProps {
    isReady: boolean;
    isDiscord: boolean;
    discord: DiscordSDK | null;
}

const DiscordContext = createContext<DiscordContextProps | undefined>(undefined);

export const useDiscord = () => {
    const context = useContext(DiscordContext);
    if (!context) throw new Error("DiscordContext is not initialized yet. Ensure the provider is correctly set up before using useDiscord.");
    return context;
};

export const DiscordProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    const [discord, setDiscord] = useState<DiscordSDK | null>(null);
    const [isReady, setReady] = useState(false);
    const [isDiscord, setIsDiscord] = useState(false);

    useEffect(() => {
        const discord = typeof window !== "undefined" && (window.location.search.includes("frame_id") || window.location.hostname.endsWith("discordsays.com"));
        setIsDiscord(discord);
        if (!discord) return;

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

            const res = await fetch("/.proxy/api/discord", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code }),
            });

            const { access_token } = await res.json();

            const auth = await sdk.commands.authenticate({ access_token });

            if (!auth) throw new Error("Authentication failed");

            setReady(true);
        })().catch(console.error);
    }, []);

    return <DiscordContext.Provider value={{ isReady, isDiscord, discord }}>{children}</DiscordContext.Provider>;
};
