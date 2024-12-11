import { MessageHandler } from "contexts";
export default function Layout({ children }: any) {
    return <MessageHandler>{children}</MessageHandler>;
}
