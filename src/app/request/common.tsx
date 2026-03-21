"use client";

import Image from "next/image";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { AnimatePresence, motion } from "framer-motion";

export function RequestCloseNextActions({
    count,
    onClose,
    onNext,
    closeLabel,
    nextLabel,
    closeType,
}: {
    count?: number;
    onClose: () => void;
    onNext: () => void;
    closeLabel: string;
    nextLabel: string;
    closeType?: "glass" | "line";
}) {
    return (
        <Layouts.Row gap={2}>
            <Controls.Button type={count ? closeType : "glass"} onClick={onClose}>
                {closeLabel}
            </Controls.Button>
            <AnimatePresence>
                {!!count && (
                    <motion.div
                        initial={{ flex: 0, marginLeft: "-2em", maxWidth: 0 }}
                        animate={{ flex: 2, marginLeft: 0, maxWidth: "100vw" }}
                        exit={{ flex: 2, marginLeft: 0, maxWidth: "100vw" }}
                        transition={{ ease: "easeInOut", duration: 0.3 }}>
                        <Controls.Button type={"glass"} onClick={onNext} style={{ width: "100%" }}>
                            {nextLabel}
                        </Controls.Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </Layouts.Row>
    );
}

export function RequestInvalid({ message, onClose, closeLabel, title }: { message: any; onClose: () => void; closeLabel: string; title: string }) {
    return (
        <Layouts.Contents.InnerContent scroll={false}>
            <Layouts.Col gap={2} align={"center"} fill>
                <Layouts.Contents.InnerContent padding={[4, 4, 0]}>
                    <Layouts.Col fill>
                        <Layouts.Col align={"center"} style={{ flex: 1 }}>
                            <Layouts.Col gap={8} align={"center"} fit>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        maxWidth: "max-content",
                                        maxHeight: "max-content",
                                        padding: "2em",
                                        borderRadius: "100%",
                                        background: "rgba(var(--white),.15)",
                                    }}>
                                    <Image
                                        width={0}
                                        height={0}
                                        src={require("../../assets/animation/failure.gif")}
                                        alt={"Unknown"}
                                        style={{ width: "8em", height: "8em" }}
                                    />
                                </div>
                            </Layouts.Col>
                        </Layouts.Col>
                        <Layouts.Col gap={8} align={"center"} style={{ flex: 1 }} fill>
                            <Layouts.Col gap={4} align={"center"} fit>
                                <Elements.Text type={"h3"}>{title}</Elements.Text>
                                <Elements.Text weight={"bold"} opacity={0.6}>
                                    {message}
                                </Elements.Text>
                            </Layouts.Col>
                        </Layouts.Col>
                    </Layouts.Col>
                </Layouts.Contents.InnerContent>
                <Layouts.Col gap={4} align={"center"} style={{ padding: "4em", paddingTop: 0 }}>
                    <Layouts.Row gap={2}>
                        <Controls.Button type={"glass"} onClick={onClose}>
                            {closeLabel}
                        </Controls.Button>
                    </Layouts.Row>
                </Layouts.Col>
            </Layouts.Col>
        </Layouts.Contents.InnerContent>
    );
}
