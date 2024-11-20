import { Metadata, Viewport } from "next";
import Providers from "./providers";
import "./global.scss";

export const metadata: Metadata = {
    applicationName: "Coinmeca Wallet",
    title: "Coinmeca Wallet",
    description: "The next generation decentralized exchange for new finance.",
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    interactiveWidget: "overlays-content",
    themeColor: "black",
};

export default function RootLayout({ children }: { children: any }) {
    return (
        <html>
            <body suppressHydrationWarning={true}>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
