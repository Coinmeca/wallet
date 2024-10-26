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
                        <WalletProvider>
                            <AccountProvider>
                                <Theme>
                                    <Style.Initialize>{children}</Style.Initialize>
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
