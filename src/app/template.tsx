import Providers from "./providers";

export default function Template({ children }: { children: any }) {
    return <Providers>
        {children}
    </Providers>
}