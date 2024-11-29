"use client";

import { useState } from "react";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { Account } from "@coinmeca/wallet-sdk/types";
import { useNotification } from "@coinmeca/ui/hooks";

import { pattern, short } from "utils";
import { Validate } from "types";
import { type Stage } from "..";

interface Contact extends Stage {
    onSelect?: Function;
    onBack?: Function;
}

export default function Contact(props: Contact) {
    const { accounts, contact } = useCoinmecaWalletProvider();
    const { addToast } = useNotification();
    const [tab, setTab] = useState("wallet");

    const [address, setAddress] = useState<string>();
    const [validate, setValidate] = useState<Validate>({ state: false });

    const validating = (a?: string): Validate => {
        let check: Validate = { state: false };
        if (!a || a === "" || a === "0" || a === "0x") check = { state: true, message: "The typed a form of a Token Contract is Invalid." };
        else if (!a?.startsWith("0x")) check = { state: true, message: "The typed a form of a Token Contract is Invalid." };
        else if (!pattern.address.test(a)) check = { state: true, message: "The unacceptable charater is used in a form." };
        else if (a?.length < 42) check = { state: true, message: "The a is too short." };
        else if (a?.length > 42) check = { state: true, message: "The a is too long." };

        setValidate(check);
        return check;
    };

    const handleBack = () => {
        props?.onBack?.();
    };

    const handleSelect = (a?: string) => {
        props?.onSelect?.(a);
        setAddress(undefined);
    };

    const handleCancel = () => {
        setAddress(undefined);
    };

    return (
        <Layouts.Contents.SlideContainer
            contents={[
                {
                    active: true,
                    children: (
                        <Layouts.Contents.InnerContent scroll={false}>
                            <Layouts.Col gap={0} style={{ background: "rgba(var(--black),0.45)" }} fill>
                                <Layouts.Row gap={0} align={"left"} style={{ padding: "0.5em clamp(2em, 5%, 8em)" }}>
                                    <Controls.Tab active={tab === "wallet"} onClick={() => setTab("wallet")} fit>
                                        My Wallets
                                    </Controls.Tab>
                                    <Controls.Tab active={tab === "recent"} onClick={() => setTab("recent")} fit>
                                        Recent
                                    </Controls.Tab>
                                </Layouts.Row>
                                <Layouts.Divider strong />
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
                                                                                style: { overflow: "hidden" },
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
                                                                                style: { overflow: "hidden" },
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
                                    right={{
                                        children: (
                                            <Controls.Button
                                                icon={"send"}
                                                scale={1.125}
                                                onClick={() => {
                                                    const { state, message } = validating(address);
                                                    if (state) addToast({ title: "Invalid Address", message });
                                                    else handleSelect(address);
                                                }}
                                            />
                                        ),
                                    }}
                                    style={{ padding: "1em clamp(2em, 5%, 8em)" }}
                                    onChange={(e: any, v: any) => {
                                        if (!validating(v)?.state) handleSelect(v);
                                    }}
                                    // lock={!!address}
                                />
                                <Layouts.Row gap={2} style={{ padding: "2em" }}>
                                    <Controls.Button onClick={handleBack}>Back</Controls.Button>
                                </Layouts.Row>
                            </Layouts.Col>
                        </Layouts.Contents.InnerContent>
                    ),
                },
            ]}
        />
    );
}
