import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { Account } from "@coinmeca/wallet-sdk/types";
import { useState } from "react";
import { type Stage } from "..";

interface Contact extends Stage {
    onSelect?: Function;
    onBack?: Function;
}

export default function Contact(props?: Contact) {
    const { accounts, contact } = useCoinmecaWalletProvider();
    const [address, setAddress] = useState<string>();

    const handleBack = () => {
        props?.onBack?.();
    };

    return (
        <Layouts.Contents.SlideContainer
            contents={[
                {
                    active: true,
                    children: (
                        <Layouts.Col gap={0} style={{ background: "rgba(var(--black),0.45)" }} fill>
                            <Layouts.Row gap={1} align={"left"} style={{ padding: "2em clamp(2em, 5%, 8em) 1.5em" }}>
                                <Controls.Tab fit>My Wallets</Controls.Tab>
                                <Controls.Tab fit>Recents</Controls.Tab>
                            </Layouts.Row>
                            <Layouts.Divider strong />
                            {console.log({ accounts })}
                            <Layouts.Contents.TabContainer
                                contents={[
                                    {
                                        active: true,
                                        children: (
                                            <Layouts.List
                                                list={accounts}
                                                formatter={(accounts: Account[]) => {
                                                    return accounts?.map((a) => ({
                                                        style: { padding: "3em clamp(3em, 5%, 8em)" },
                                                        onClick: () => setAddress(a?.address),
                                                        children: [
                                                            [
                                                                {
                                                                    gap: 2,
                                                                    children: [
                                                                        {
                                                                            fit: true,
                                                                            children: [
                                                                                <>
                                                                                    <Elements.Icon icon={"wallet"} scale={1.5} />
                                                                                </>,
                                                                            ],
                                                                        },
                                                                        {
                                                                            gap: 0,
                                                                            children: [
                                                                                <>
                                                                                    <Elements.Text height={0} fix>
                                                                                        {a?.name}
                                                                                    </Elements.Text>
                                                                                </>,
                                                                                <>
                                                                                    <Elements.Text height={0} opacity={0.3} fix>
                                                                                        {a?.address}
                                                                                    </Elements.Text>
                                                                                </>,
                                                                            ],
                                                                        },
                                                                    ],
                                                                },
                                                            ],
                                                        ],
                                                    }));
                                                }}
                                            />
                                        ),
                                    },
                                    {
                                        active: false,
                                        children: (
                                            <Layouts.List
                                                list={contact?.["recent"] || []}
                                                formatter={(accounts: Account[]) => {
                                                    return accounts?.map((a) => ({
                                                        style: { padding: "3em clamp(3em, 5%, 8em)" },
                                                        onClick: () => setAddress(a?.address),
                                                        children: [
                                                            [
                                                                {
                                                                    gap: 2,
                                                                    children: [
                                                                        {
                                                                            fit: true,
                                                                            children: [
                                                                                <>
                                                                                    <Elements.Icon icon={"wallet"} scale={1.5} />
                                                                                </>,
                                                                            ],
                                                                        },
                                                                        {
                                                                            gap: 0,
                                                                            children: [
                                                                                <>
                                                                                    <Elements.Text height={0} fix>
                                                                                        {a?.name}
                                                                                    </Elements.Text>
                                                                                </>,
                                                                                <>
                                                                                    <Elements.Text height={0} opacity={0.3} fix>
                                                                                        {a?.address}
                                                                                    </Elements.Text>
                                                                                </>,
                                                                            ],
                                                                        },
                                                                    ],
                                                                },
                                                            ],
                                                        ],
                                                    }));
                                                }}
                                            />
                                        ),
                                    },
                                ]}
                            />
                            <Controls.Input
                                placeholder={"Enter the recipient address directly..."}
                                gap={2}
                                right={{ children: <Elements.Icon icon={"send"} scale={1.25} /> }}
                                style={{ padding: "2em" }}
                            />
                            <Layouts.Row gap={2} style={{ padding: "2em" }}>
                                <Controls.Button onClick={handleBack}>Back</Controls.Button>
                            </Layouts.Row>
                        </Layouts.Col>
                    ),
                },
                {
                    active: false,
                },
            ]}
        />
    );
}
