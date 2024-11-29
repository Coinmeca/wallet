"use client";

import { useMemo } from "react";
import { Controls, Layouts } from "@coinmeca/ui/components";
import { Parts } from "@coinmeca/ui/index";
import { parseNumber } from "@coinmeca/ui/lib/utils";
import { Asset } from "types";

interface Amount {
    asset?: Asset;
    amount?: string | number;
    onChange?: Function;
    onConfirm?: Function;
    onBack?: Function;
}

export default function Amount(props: Amount) {
    const width = 64;
    const asset = props?.asset;

    const amount = useMemo(() => (props?.amount ? props?.amount : undefined), [props?.amount]);
    const condition = useMemo(() => amount && parseNumber(amount) > 10 ** -(asset?.decimals || 1), [amount]);

    const handleBack = () => {
        props?.onBack?.();
    };

    const handleConfirm = () => {
        props?.onConfirm?.(parseNumber(amount));
    };

    const handleChange = (v?: string) => {
        props?.onChange?.(!v || v === "" ? undefined : v);
    };

    return (
        <Layouts.Col gap={0} style={{ background: "rgba(var(--black),.45)", padding: "2em" }} fill>
            <Layouts.Col gap={0} fill>
                <Parts.Numberpads.Currency type="currency" width={width} value={amount} max={asset?.balance} onChange={(e: any, v: any) => handleChange(v)} />
                <Layouts.Row gap={2}>
                    <Controls.Button onClick={handleBack}>Back</Controls.Button>
                    <Layouts.Row
                        style={{
                            ...(condition
                                ? { maxWidth: "100%", opacity: 1 }
                                : {
                                      maxWidth: 0,
                                      opacity: 0,
                                      marginLeft: "-2em",
                                      pointerEvents: "none",
                                      curosr: "default",
                                  }),
                            transition: ".3s ease",
                        }}>
                        <Controls.Button type={"glass"} onClick={handleConfirm}>
                            Confirm
                        </Controls.Button>
                    </Layouts.Row>
                </Layouts.Row>
            </Layouts.Col>
        </Layouts.Col>
    );
}
