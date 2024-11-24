import { Elements, Layouts } from "@coinmeca/ui/components";
import { usePortal } from "@coinmeca/ui/hooks";
import { format } from "@coinmeca/ui/lib/utils";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { GetErc20 } from "api/erc20";
import { Modals } from "containers";
import { useCallback } from "react";
import { Asset } from "types";

export default function Fungibles() {
    const { account, chain, tokens } = useCoinmecaWalletProvider();

    const [openFungibleAdd, closeAddFungible] = usePortal(() => <Modals.Fungible.Add onClose={closeAddFungible} />);
    const [fungibles] = GetErc20(chain?.rpcUrls?.[0], tokens?.fungibles, account?.address);
    const fungiblesList = useCallback(
        (tokens?: Asset[]) => {
            return [
                ...(tokens || [])
                    ?.map(
                        (t?: Asset) =>
                            typeof t === "object" && {
                                style: { padding: "1.5em" },
                                children: [
                                    [
                                        {
                                            gap: 1.5,
                                            children: [
                                                {
                                                    fit: true,
                                                    children: (
                                                        <>
                                                            <Elements.Avatar
                                                                size={4}
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
                    ?.filter((a) => a),
                {
                    onClick: openFungibleAdd,
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
                                                scale={0.75}
                                                icon={"plus-bold"}
                                                style={{ padding: "0.5em", borderRadius: "100%", border: "0.1em solid rgb(var(--white))" }}
                                            />
                                        ),
                                    },
                                    <>
                                        <Elements.Text>Add Fungible Token</Elements.Text>
                                    </>,
                                ],
                            },
                        ],
                    ],
                },
            ];
        },
        [tokens?.fungibles, fungibles],
    );

    return <Layouts.List list={Object.values(fungibles?.data || [{}])} formatter={fungiblesList} />;
}
