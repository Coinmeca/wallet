"use client";

import { useState } from "react";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { Account } from "@coinmeca/wallet-sdk/types";

import { pattern } from "utils";
import { Validate } from "types";
import { type Stage } from "..";

interface Contact extends Stage {
    onSelect?: Function;
    onBack?: Function;
}

export default function Contact(props: Contact) {
    const { accounts, contact } = useCoinmecaWalletProvider();
    const [tab, setTab] = useState("wallet");

    const [address, setAddress] = useState<string>();
    const [validate, setValidate] = useState<Validate>({ state: false });

    const handleValidate = (a?: string) => {
        let check: Validate = { state: false };
        if (!!a && a !== "" && a !== "0" && a !== "0x") {
            if (!a?.startsWith("0x")) check = { state: true, message: "The typed a form of a Token Contract is Invalid." };
            else if (!pattern.address.test(a)) check = { state: true, message: "The unacceptable charater is used in a form." };
            else if (a?.length < 42) check = { state: true, message: "The a is too short." };
            else if (a?.length > 42) check = { state: true, message: "The a is too long." };
            if (check.state) return setValidate(check);
            handleSelect(a);
        }
    };

    const handleBack = () => {
        props?.onBack?.();
    };

    const handleSelect = (a?: string) => {
        props?.onSelect?.(a);
    };

    return (
        <Layouts.Contents.SlideContainer
            contents={[
                {
                    active: true,
                    children: (
                        <Layouts.Col gap={0} style={{ background: "rgba(var(--black),0.45)" }} fill>
                            <Layouts.Row gap={1} align={"left"} style={{ padding: "2em clamp(2em, 5%, 8em) 1.5em" }}>
                                <Controls.Tab active={tab === "wallet"} onClick={() => setTab("wallet")} fit>
                                    My Wallets
                                </Controls.Tab>
                                <Controls.Tab active={tab === "recent"} onClick={() => setTab("recent")} fit>
                                    Recent
                                </Controls.Tab>
                            </Layouts.Row>
                            <Layouts.Divider strong />
                            {console.log({ accounts })}
                            <Layouts.Contents.TabContainer
                                contents={[
                                    {
                                        active: tab === "wallet",
                                        children: (
                                            <Layouts.List
                                                list={accounts}
                                                formatter={(accounts: Account[]) => {
                                                    return accounts?.map((a) => ({
                                                        style: { padding: "3em clamp(3em, 5%, 8em)" },
                                                        onClick: () => handleSelect(a?.address),
                                                        children: [
                                                            [
                                                                {
                                                                    gap: 2,
                                                                    children: [
                                                                        {
                                                                            fit: true,
                                                                            children: [
                                                                                <>
                                                                                    <Elements.Icon icon={"wallet"} scale={1.25} />
                                                                                </>,
                                                                            ],
                                                                        },
                                                                        {
                                                                            gap: 0,
                                                                            children: [
                                                                                <>
                                                                                    <Elements.Text size={1.5} height={1.5} title={a?.name} fix>
                                                                                        {a?.name}
                                                                                    </Elements.Text>
                                                                                </>,
                                                                                <>
                                                                                    <Elements.Text
                                                                                        size={1.375}
                                                                                        height={1.5}
                                                                                        weight={"light"}
                                                                                        opacity={0.6}
                                                                                        title={a?.address}
                                                                                        fix>
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
                                        active: tab === "recents",
                                        children: (
                                            <Layouts.List
                                                list={contact?.["recent"] || []}
                                                formatter={(accounts: Account[]) => {
                                                    return accounts?.map((a) => ({
                                                        style: { padding: "3em clamp(3em, 5%, 8em)" },
                                                        onClick: () => handleSelect(a?.address),
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
                                onChange={(e: any, v: any) => handleValidate(v)}
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
