"use client";
import { StrictMode } from "react";
import { Notification, Theme, WindowSize } from "@coinmeca/ui/contexts";
import { Style } from "@coinmeca/ui/lib";
import { DiscordProvider, MessageHandler } from "contexts";
import { dehydrate, HydrationBoundary, QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "api";
import { GuardProvider } from "contexts/guard";
import { CoinmecaWalletContextProvider } from "@coinmeca/wallet-provider/provider";

export default function Providers({ children }: { children: any }) {
    const client = getQueryClient();

    return (
        <StrictMode>
            <WindowSize>
                <DiscordProvider>
                    <CoinmecaWalletContextProvider>
                        <MessageHandler>
                            <Theme>
                                <QueryClientProvider {...{ client }}>
                                    <HydrationBoundary state={dehydrate(client)}>
                                        <GuardProvider>
                                            <Notification>
                                                <Style.Initialize>{children}</Style.Initialize>
                                            </Notification>
                                        </GuardProvider>
                                    </HydrationBoundary>
                                </QueryClientProvider>
                            </Theme>
                        </MessageHandler>
                    </CoinmecaWalletContextProvider>
                </DiscordProvider>
            </WindowSize>
        </StrictMode>
    );
}
