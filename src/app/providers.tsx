"use client";
import { Analytics } from "@vercel/analytics/react";
import { Theme, WindowSize } from "@coinmeca/ui/contexts";
import { Style } from "@coinmeca/ui/lib";
import { TelegramProvider } from "contexts";
import { StrictMode } from "react";

export default function Providers({ children }: { children: any }) {
    return (
        <StrictMode>
            <WindowSize>
            <TelegramProvider>
                <Theme>
                
                            <Style.Initialize>{children}</Style.Initialize>
                </Theme>
                </TelegramProvider>
            </WindowSize>
            <Analytics />
        </StrictMode>
    );
}