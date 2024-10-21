import { Frames } from "@coinmeca/ui/containers";

export default function Template({ children }: { children: any }) {
    return <Frames.Frame>
        {children}
    </Frames.Frame>
}