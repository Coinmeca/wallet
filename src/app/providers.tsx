"use client";
import { Analytics } from "@vercel/analytics/react";
import { Theme, WindowSize } from "@coinmeca/ui/contexts";
import { Style } from "@coinmeca/ui/lib";
import { AccountProvider, StorageProvider, TelegramProvider } from "contexts";
import { StrictMode } from "react";

export default function Providers({ children }: { children: any }) {
    return (
        <StrictMode>
            <WindowSize>
                <TelegramProvider>
                    <StorageProvider>
                        <AccountProvider>
                            <Theme>
                                <Style.Initialize>{children}</Style.Initialize>
                            </Theme>
                        </AccountProvider>
                    </StorageProvider>
                </TelegramProvider>
            </WindowSize>
            <Analytics />
        </StrictMode>
    );
}
