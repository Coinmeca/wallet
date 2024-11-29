"use client";

import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { usePortal } from "@coinmeca/ui/hooks";
import { filter } from "@coinmeca/ui/lib/utils";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { Chain } from "@coinmeca/wallet-sdk/types";
import { Modals } from "containers";
import { useCallback } from "react";

export default function Chains({
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
    const { provider, chain, chains } = useCoinmecaWalletProvider();

    const [openChainEditModal, closeChainEditModal] = usePortal((props: any) => <Modals.Chain.Edit {...props} onClose={closeChainEditModal} close />);
    const [openChainRemoveModal, closeChainRemoveModal] = usePortal((props: any) => <Modals.Chain.Remove {...props} onClose={closeChainRemoveModal} close />);

    const chainlist = useCallback(
        (chains: Chain[] = []) =>
            chains?.map((chain: Chain) => ({
                style: { padding: responsive ? "2.5em clamp(2em, 5%, 8em)" : "2em 3em" },
                onClick: provider?.chain?.chainId !== chain?.chainId && (() => {}),
                children: [
                    [
                        [
                            {
                                style: { ...(provider?.chain?.chainId === chain?.chainId && { opacity: 0.3, pointerEvents: "none" }) },
                                onClick: () => {
                                    provider?.changeChain(chain?.chainId);
                                    onClose?.();
                                },
                                children: (
                                    <>
                                        <Layouts.Row gap={2}>
                                            <Layouts.Row gap={1} fit>
                                                <Elements.Avatar img={chain?.logo || `https://web3.coinmeca.net/${chain?.chainId}/logo.svg`} />
                                            </Layouts.Row>
                                            <Elements.Text size={1.5}>{chain?.chainName}</Elements.Text>
                                        </Layouts.Row>
                                    </>
                                ),
                            },
                            {
                                fit: true,
                                style: { pointerEvents: "initial", maxWitdth: "max-content" },
                                children: (
                                    <Controls.Dropdown
                                        type={"more"}
                                        options={[
                                            { icon: "write", value: "Edit Chain Info" },
                                            { icon: "bin", value: `Remove ${chain?.chainName}` },
                                        ]}
                                        onClickItem={(e: any, v: any, k: number) => {
                                            switch (k) {
                                                case 0:
                                                    return openChainEditModal({ chain });
                                                case 1:
                                                    return openChainRemoveModal({ chain });
                                            }
                                        }}
                                        responsive={isMobile && responsive}
                                        chevron={false}
                                        fix
                                        fit
                                    />
                                ),
                            },
                        ],
                    ],
                ],
            })),
        [chain, chains],
    );

    const [openChainAddModal, closeChainAddModal] = usePortal(() => <Modals.Chain.Add onClose={closeChainAddModal} />);

    return (
        <Layouts.Col gap={0} fill>
            {search}
            <Layouts.List list={filter(chains, searchFilter)} formatter={chainlist} />
            <Layouts.Col style={{ padding: "4em", paddingTop: "0" }} fit>
                <Controls.Button type={"line"} iconLeft={"plus-small-bold"} onClick={openChainAddModal}>
                    Add new chain
                </Controls.Button>
            </Layouts.Col>
        </Layouts.Col>
    );
}
