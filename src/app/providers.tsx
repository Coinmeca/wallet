"use client";
import { Analytics } from "@vercel/analytics/react";
import { Theme, WindowSize } from "@coinmeca/ui/contexts";
import { Style } from "@coinmeca/ui/lib";
import { AccountProvider, StorageProvider, TelegramProvider, WalletProvider } from "contexts";
import { StrictMode } from "react";

export default function Providers({ children }: { children: any }) {
    return (
        <StrictMode>
            <WindowSize>
                <TelegramProvider>
                    <StorageProvider>
                        <AccountProvider>
                            <WalletProvider>
                                <Theme>
                                    <Style.Initialize>{children}</Style.Initialize>
                                </Theme>
                            </WalletProvider>
                        </AccountProvider>
                    </StorageProvider>
                </TelegramProvider>
            </WindowSize>
            <Analytics />
        </StrictMode>
    );
}
