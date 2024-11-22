'use client';

import { Elements, Layouts } from "@coinmeca/ui/components";
import { usePortal } from "@coinmeca/ui/hooks";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { Asset } from "@coinmeca/ui/types";
import { useCallback } from "react";
import { format } from "@coinmeca/ui/lib/utils";
import { useQueries } from "@tanstack/react-query";
import { query } from "api/onchain/query";
import { Modals } from "containers";
import { GetErc20 } from "api/erc20";
import { zeroAddress } from "types";

export default function Activity() {
    const { account, accounts, chain, tx } = useCoinmecaWalletProvider();
    const balance = useQueries({
        queries: (accounts || [])?.map((a) => query.balance(chain?.rpcUrls?.[0], a?.address)),
    });

    const [openFungibleAdd, closeAddFungible] = usePortal(() => <Modals.Fungible.Add onClose={closeAddFungible} />);
    const formatter = useCallback(
        (tokens?: Asset[]) => {
            return tokens?.map(
                (t?: Asset) =>
                    typeof t === "object" && {
                        style: { padding: "1.5em" },
                        children: [
                            [
                                {
                                    gap: 1,
                                    children: [
                                        {
                                            fit: true,
                                            children: (
                                                <>
                                                    <Elements.Avatar
                                                        size={3.5}
                                                        img={`https://web3.coinmeca.net/${chain?.chainId}/${t?.address}/logo.svg`}
                                                    />
                                                </>
                                            ),
                                        },
                                        [
                                            [
                                                [
                                                    [
                                                        {
                                                            gap: 0,
                                                            children: [
                                                                <>
                                                                    <Elements.Text height={0}>{t?.symbol}</Elements.Text>
                                                                </>,
                                                                <>
                                                                    <Elements.Text height={0} opacity={0.6}>
                                                                        {t?.name}
                                                                    </Elements.Text>
                                                                </>,
                                                            ],
                                                        },
                                                    ],
                                                ],
                                                [
                                                    {
                                                        align: "right",
                                                        children: (
                                                            <>
                                                                <Elements.Text>
                                                                    {format(t?.balance || 0, "currency", {
                                                                        unit: 9,
                                                                        limit: 12,
                                                                        fix: 9,
                                                                    })}
                                                                </Elements.Text>
                                                            </>
                                                        ),
                                                    },
                                                ],
                                            ],
                                        ],
                                    ],
                                },
                            ],
                        ],
                    },
            );
        },
        [tokens?.fungibles, fungibles],
    );

    const list = useCallback(() => (chain?.chainId && tx?.[`${chain.chainId}`]) || [], [chain?.chainId])

    return  <Layouts.List
        list={list}
        formatter={formatter}
        fill
    />
}
