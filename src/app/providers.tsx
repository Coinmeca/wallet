import { TelegramProvider } from "contexts";

export default function Providers({ children }: { children: any }) {
    return <TelegramProvider>
        {children}
    </TelegramProvider>;

}