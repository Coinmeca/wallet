import Head from "next/head"
import Script from "next/script"

export default function Providers({ children }: { children: any }) {
    return <>
        <Script src="https://telegram.org/js/telegram-web-app.js" />
        {children}
    </>;

}