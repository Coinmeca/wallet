"use client";
import { Analytics } from "@vercel/analytics/react";
import { Theme, WindowSize } from "@coinmeca/ui/contexts";
import { Style } from "@coinmeca/ui/lib";
import { AccountProvider, StorageProvider, TelegramProvider, WalletProvider } from "contexts";
import { StrictMode } from "react";
import { dehydrate, HydrationBoundary, QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "api";

export default function Providers({ children }: { children: any }) {
    const client = getQueryClient();

    return (
        <StrictMode>
            <WindowSize>
                <TelegramProvider>
                    <StorageProvider>
                        <WalletProvider>
                            <AccountProvider>
                                <Theme>
                                    <QueryClientProvider {...{ client }}>
                                        <HydrationBoundary state={dehydrate(client)}>
                                            <Style.Initialize>{children}</Style.Initialize>
                                        </HydrationBoundary>
                                    </QueryClientProvider>
                                </Theme>
                            </AccountProvider>
                        </WalletProvider>
                    </StorageProvider>
                </TelegramProvider>
            </WindowSize>
            <Analytics />
        </StrictMode>
    );
}
