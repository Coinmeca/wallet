"use client";

import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { useNotification, usePortal } from "@coinmeca/ui/hooks";
import { filter, format } from "@coinmeca/ui/lib/utils";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { Account } from "@coinmeca/wallet-sdk/types";
import { useQueries } from "@tanstack/react-query";
import { query } from "api/onchain/query";
import { Modals } from "containers";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { short } from "utils";

export default function Accounts({
    search,
    searchFilter,
    responsive,
    isMobile,
    onClose,
}: {
    search: any;
    searchFilter?: string;
    responsive: boolean;
    isMobile?: boolean;
    onClose?: Function;
}) {
    const path = usePathname();
    const isDisplay = useMemo(() => !path?.startsWith("/welcome") && !path?.startsWith("/create"), [path]);

    const { provider, chain, account, accounts } = useCoinmecaWalletProvider();
    const { addToast } = useNotification();

    const [showDisabledAccount, setShowDisabledAccount] = useState<boolean>(false);
    const [openAccountEditModal, closeAccountEditModal] = usePortal((props: any) => <Modals.Account.Edit {...props} onClose={closeAccountEditModal} />);
    const [openShowPrivateKey, closeShowPrivateKey] = usePortal((props: any) => <Modals.Account.Show {...props} onClose={closeShowPrivateKey} />);

    const router = useRouter();
    const balance = useQueries({
        queries: (accounts || [])?.map((a) => query.balance(chain?.rpcUrls?.[0], a?.address)),
    });

    const handleAccountChange = (account: Account) => {
        provider?.changeAccount(account?.index);
        onClose?.();
    };

    const handleCopyAddress = (account: Account) => {
        navigator.clipboard
            .writeText(account.address)
            .then(function () {
                addToast({
                    title: `Copy address`,
                    message: `The address of ${account.name} copied.`,
                });
                // addToast(toast.alert.copy.success);
            })
            .catch(function (err) {
                addToast({
                    title: `Copy address`,
                    message: `Failed to copy the address of ${account.name}.`,
                });
                // addToast(toast.alert.copy.failure);
            });
    };

    const handleShowPrivateKey = (account: Account) => {
        openShowPrivateKey(account);
    };

    const handleAccountEdit = (account: Account) => {
        openAccountEditModal({ account });
    };

    const handleAccountState = (a: Account) => {
        provider?.updateAccount({ ...a, disable: !a?.disable });
    };

    const accountlist = useCallback(
        (accounts: Account[] = []) =>
            (showDisabledAccount ? accounts : accounts.filter((a) => !a?.disable)).map((a: Account, i: number) => {
                const selected = account?.address?.toLowerCase() === a?.address?.toLowerCase();
                return {
                    onClick: !selected && (() => {}),
                    style: {
                        padding: responsive ? "2.5em clamp(2em, 5%, 8em)" : "2em 3em",
                        ...(selected && { background: "transparent", pointerEvents: "none" }),
                    },
                    children: [
                        [
                            [
                                {
                                    style: { overflow: "hidden" },
                                    children: [
                                        {
                                            gap: 2,
                                            style: selected ? { opacity: 0.3 } : {},
                                            onClick: () => handleAccountChange(a),
                                            children: [
                                                {
                                                    fit: true,
                                                    children: (
                                                        <Elements.Avatar
                                                            // color={colorMap}
                                                            scale={1.25}
                                                            size={2.5}
                                                            // display={6}
                                                            // ellipsis={" ... "}
                                                            character={`${a?.index + 1}`}
                                                            name={a?.address}
                                                            stroke={0.2}
                                                            hideName
                                                        />
                                                    ),
                                                },
                                                {
                                                    gap: 0,
                                                    children: [
                                                        <>
                                                            <Elements.Text size={1.5} height={1.5} title={a?.name} fix>
                                                                {a?.name}
                                                            </Elements.Text>
                                                        </>,
                                                        {
                                                            children: [
                                                                <>
                                                                    <Elements.Text
                                                                        size={1.375}
                                                                        height={1.5}
                                                                        weight={"light"}
                                                                        opacity={0.6}
                                                                        title={a?.address}
                                                                        fix>
                                                                        {short(a?.address)}
                                                                    </Elements.Text>
                                                                </>,
                                                                {
                                                                    align: "right",
                                                                    children: [
                                                                        [
                                                                            <>
                                                                                <Elements.Text align={"right"} fix>
                                                                                    {balance[i]?.isLoading
                                                                                        ? "~"
                                                                                        : format(balance[i]?.data, "currency", {
                                                                                              unit: 9,
                                                                                              limit: 12,
                                                                                              fix: 9,
                                                                                          })}
                                                                                </Elements.Text>
                                                                            </>,
                                                                            {
                                                                                fit: true,
                                                                                children: (
                                                                                    <>
                                                                                        <Elements.Text opacity={0.3} fit>
                                                                                            {chain?.nativeCurrency?.symbol}
                                                                                        </Elements.Text>
                                                                                    </>
                                                                                ),
                                                                            },
                                                                        ],
                                                                    ],
                                                                },
                                                            ],
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    fit: true,
                                    children: [
                                        {
                                            gap: 0,
                                            fit: true,
                                            style: { pointerEvents: "initial", maxWitdth: "max-content" },
                                            children: [
                                                <>
                                                    <Controls.Button icon={"copy"} onClick={() => handleCopyAddress(a)} />
                                                </>,
                                                <>
                                                    <Controls.Dropdown
                                                        type={"more"}
                                                        options={[
                                                            { icon: "key", value: "Show Private Key" },
                                                            { icon: "write", value: "Edit Account Name" },
                                                            a?.disable
                                                                ? { icon: "show", value: `Enable ${a?.name}` }
                                                                : { icon: "hide", value: `Disable ${a?.name}` },
                                                        ]}
                                                        onClickItem={(e: any, v: any, k: number) => {
                                                            switch (k) {
                                                                case 0:
                                                                    return handleShowPrivateKey(a);
                                                                case 1:
                                                                    return handleAccountEdit(a);
                                                                case 2:
                                                                    return handleAccountState(a);
                                                                default:
                                                                    return;
                                                            }
                                                        }}
                                                        responsive={isMobile && responsive}
                                                        chevron={false}
                                                        fix
                                                        fit
                                                    />
                                                    {/* <Controls.Button icon={"more"} /> */}
                                                </>,
                                            ],
                                        },
                                    ],
                                },
                            ],
                        ],
                    ],
                };
            }),
        [account, accounts, balance, showDisabledAccount],
    );

    return (
        <Layouts.Col gap={0} fill>
            {search}
            <Layouts.List list={filter(accounts, searchFilter)} formatter={accountlist} />
            {isDisplay && (
                <Layouts.Col style={{ padding: "4em", paddingTop: "0" }} fit>
                    {accounts?.filter((a) => a?.disable)?.length ? (
                        <Controls.Button iconLeft={showDisabledAccount ? "hide" : "show"} onClick={() => setShowDisabledAccount(!showDisabledAccount)}>
                            {showDisabledAccount ? "Hide" : "Show"} disabled accounts
                        </Controls.Button>
                    ) : (
                        <></>
                    )}
                    <Controls.Button
                        type={"line"}
                        iconLeft={"plus-small-bold"}
                        onClick={() => {
                            router.push("/create");
                        }}>
                        Create or Import wallet
                    </Controls.Button>
                </Layouts.Col>
            )}
        </Layouts.Col>
    );
}
