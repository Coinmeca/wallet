"use client";

import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { useNotification, usePortal } from "@coinmeca/ui/hooks";
import { filter, format } from "@coinmeca/ui/lib/utils";
import { parseChainId } from "@coinmeca/wallet-provider/chains";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { Account } from "@coinmeca/wallet-sdk/types";
import { useQueries } from "@tanstack/react-query";
import { query } from "api/onchain/query";
import { Account as Modals } from "containers/modals";
import { useTranslate } from "hooks";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { short, valid } from "utils";

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
    const { t } = useTranslate();

    const { provider, accounts } = useCoinmecaWalletProvider();
    const { addToast } = useNotification();
    const activeAddress = provider?.address;
    const activeChainId = useMemo(() => {
        const providerChainId = provider?.chainId;
        return typeof providerChainId !== "undefined" && valid.chainId(providerChainId) ? parseChainId(providerChainId) : undefined;
    }, [provider?.chainId]);
    const activeChain = useMemo(
        () =>
            typeof activeChainId === "number"
                ? provider?.chains?.find((item: any) => typeof item?.chainId !== "undefined" && parseChainId(item.chainId) === activeChainId)
                : undefined,
        [activeChainId, provider?.chains],
    );

    const [showDisabledAccount, setShowDisabledAccount] = useState<boolean>(false);
    const [openAccountEditModal, closeAccountEditModal] = usePortal((props: any) => <Modals.Edit {...props} onClose={closeAccountEditModal} />);
    const [openShowPrivateKey, closeShowPrivateKey] = usePortal((props: any) => <Modals.Show {...props} onClose={closeShowPrivateKey} />);

    const router = useRouter();
    const balance = useQueries({
        queries: (accounts || [])?.map((a) => query.balance(activeChain?.rpcUrls?.[0], a?.address)),
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
                    title: t("app.wallet.address.copy"),
                    message: t("app.wallet.address.copy.success", { name: account.name }),
                });
                // addToast(toast.alert.copy.success);
            })
            .catch(function (err) {
                addToast({
                    title: t("app.wallet.address.copy"),
                    message: t("app.wallet.address.copy.failure", { name: account.name }),
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
                const selected = activeAddress?.toLowerCase() === a?.address?.toLowerCase();
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
                                                                                            {activeChain?.nativeCurrency?.symbol}
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
                                                            { icon: "key", value: t("app.sidebar.account.private.key.show") },
                                                            { icon: "write", value: t("app.sidebar.account.name.edit") },
                                                            a?.disable
                                                                ? { icon: "show", value: t("app.sidebar.account.enable", { name: a?.name || "" }) }
                                                                : { icon: "hide", value: t("app.sidebar.account.disable", { name: a?.name || "" }) },
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
        [activeAddress, activeChain?.nativeCurrency?.symbol, balance, showDisabledAccount],
    );

    return (
        <Layouts.Col gap={0} fill>
            {search}
            <Layouts.List list={filter(accounts, searchFilter)} formatter={accountlist} />
            {isDisplay && (
                <Layouts.Col style={{ padding: "4em", paddingTop: "0" }} fit>
                    {accounts?.filter((a) => a?.disable)?.length ? (
                        <Controls.Button iconLeft={showDisabledAccount ? "hide" : "show"} onClick={() => setShowDisabledAccount(!showDisabledAccount)}>
                            {showDisabledAccount
                                ? t("app.sidebar.account.disabled.hide")
                                : t("app.sidebar.account.disabled.show")}
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
                        {t("app.sidebar.account.create.import")}
                    </Controls.Button>
                </Layouts.Col>
            )}
        </Layouts.Col>
    );
}
