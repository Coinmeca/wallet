import { Controls, Layouts } from "@coinmeca/ui/components";
import { Parts } from "@coinmeca/ui/index";
import { parseNumber } from "@coinmeca/ui/lib/utils";
import { useMemo, useState } from "react";
import { Asset } from "types";

interface AmmountInput {
    asset: Asset;
    amount: number;
    onChange?: Function;
    onConfirm?: Function;
    onBack?: Function;
}

export default function AmountInput(props: AmmountInput) {
    const width = 64;
    const asset = props?.asset;
    const amount = props?.amount;

    const condition = useMemo(() => amount && parseNumber(amount) > 10 ** -(asset?.decimals || 1), [amount]);

    const handleBack = () => {
        props?.onBack?.();
    };

    const handleConfirm = () => {
        props?.onConfirm?.();
    };

    const handleChange = () => {
        props?.onChange?.();
    };

    return (
        <Layouts.Col gap={0} style={{ background: "rgba(var(--black),.45)", padding: "2em" }} fill>
            <Layouts.Col gap={0} fill>
                <Parts.Numberpads.Currency type="currency" width={width} value={amount} max={asset?.balance} onChange={handleChange} />
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
