"use client";
import { Frames } from "@coinmeca/ui/containers";
import Data from "./data";

export default function RootTemplate({ children }: { children: any }) {
    const { header } = Data();

    return (
        <Frames.Frame
            // header={header}
            // align={"right"}
            background={{ img: { src: 2 } }}
            // side={56}
        >
            {children}
        </Frames.Frame>
    );
}