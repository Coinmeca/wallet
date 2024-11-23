"use client";

import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { usePortal, useSort } from "@coinmeca/ui/hooks";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { useCallback } from "react";
import { format } from "@coinmeca/ui/lib/utils";
import { Modals } from "containers";
import { GetErc721 } from "api/erc721";

export default function Nft() {
    const { chain, tokens } = useCoinmecaWalletProvider();
    const [nonFungibles] = GetErc721(chain?.rpcUrls?.[0], tokens?.nonFungibles ? Object.values(tokens?.nonFungibles) : []);

    const [openNonFungibleAdd, closeNonFungibleAdd] = usePortal(() => <Modals.NonFungible.Add onClose={closeNonFungibleAdd} />);
    const formatter = useCallback(
        (tokens?: any[]) => {
            return [
                ...(tokens
                    ?.map(
                        (t?: any) =>
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
                    )
                    .filter((t) => t) || []),
                {
                    onClick: openNonFungibleAdd,
                    style: { padding: "1.75em 1.5em" },
                    children: [
                        [
                            {
                                gap: 1.5,
                                children: [
                                    {
                                        fit: true,
                                        children: (
                                            <Elements.Icon
                                                scale={0.666}
                                                icon={"plus-bold"}
                                                style={{ padding: "0.5em", borderRadius: "100%", border: "0.1em solid rgb(var(--white))" }}
                                            />
                                        ),
                                    },
                                    <>
                                        <Elements.Text>Add a new token</Elements.Text>
                                    </>,
                                ],
                            },
                        ],
                    ],
                },
            ];
        },
        [tokens?.nonFungibles, nonFungibles],
    );

    const { sorting, sortArrow, setSort } = useSort();
    const sorts = {
        name: { key: "name", type: "string" },
        address: { key: "address", type: "string" },
        id: { key: "balance", type: "number" },
    };

    return (
        <Layouts.Col gap={0}>
            <Layouts.Row gap={1} fix style={{ overflow: "auto hidden" }}>
                <Layouts.Row gap={0} fix>
                    <Controls.Tab iconLeft={sortArrow(sorts.name)} onClick={() => setSort(sorts.name)}>
                        Name
                    </Controls.Tab>
                    <Controls.Tab iconLeft={sortArrow(sorts.address)} onClick={() => setSort(sorts.address)}>
                        Address
                    </Controls.Tab>
                    <Controls.Tab iconLeft={sortArrow(sorts.id)} onClick={() => setSort(sorts.id)}>
                        Token ID
                    </Controls.Tab>
                </Layouts.Row>
            </Layouts.Row>
            <Layouts.Divider />
            <Layouts.List
                list={sorting([
                    {},
                    ...Object.values(nonFungibles)
                        ?.map(({ data }) => data)
                        .filter((t) => t),
                ])}
                formatter={formatter}
                fill
            />
        </Layouts.Col>
    );
}
