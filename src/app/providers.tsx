"use client";
import { StrictMode } from "react";
import { Analytics } from "@vercel/analytics/react";
import { Notification, Theme, WindowSize } from "@coinmeca/ui/contexts";
import { Style } from "@coinmeca/ui/lib";
import { MessageHandler, StorageProvider, TelegramProvider } from "contexts";
import { dehydrate, HydrationBoundary, QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "api";
import { GuardProvider } from "contexts/guard";
import { CoinmecaWalletAdapterContextProvider, CoinmecaWalletContextProvider } from "@coinmeca/wallet-sdk/contexts";

export default function Providers({ children }: { children: any }) {
    const client = getQueryClient();

    return (
        <StrictMode>
            <WindowSize>
                <TelegramProvider>
                    <StorageProvider>
                        <CoinmecaWalletContextProvider>
                            <CoinmecaWalletAdapterContextProvider>
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
                            </CoinmecaWalletAdapterContextProvider>
                        </CoinmecaWalletContextProvider>
                    </StorageProvider>
                </TelegramProvider>
            </WindowSize>
            <Analytics />
        </StrictMode>
    );
}
