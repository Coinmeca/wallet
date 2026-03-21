"use client";

import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { usePortal } from "@coinmeca/ui/hooks";
import { filter } from "@coinmeca/ui/lib/utils";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { Chain } from "@coinmeca/wallet-sdk/types";
import { parseChainId, valid } from "@coinmeca/wallet-sdk/utils";
import { useCallback, useMemo } from "react";
import { Chain as Modals } from "containers/modals";
import { useTranslate } from "hooks";
import { chainLogo } from "utils";

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
    const { provider, chains } = useCoinmecaWalletProvider();
    const { t } = useTranslate();
    const activeChainId = useMemo(() => {
        const providerChainId = provider?.chainId;
        return typeof providerChainId !== "undefined" && valid.chainId(providerChainId) ? parseChainId(providerChainId) : undefined;
    }, [provider?.chainId]);

    const [openRpcChangeModal, closeRpcChangeModal] = usePortal((props: any) => <Modals.Change.Rpc {...props} onClose={closeRpcChangeModal} close />);
    const [openChainEditModal, closeChainEditModal] = usePortal((props: any) => <Modals.Edit {...props} onClose={closeChainEditModal} close />);
    const [openChainRemoveModal, closeChainRemoveModal] = usePortal((props: any) => <Modals.Remove {...props} onClose={closeChainRemoveModal} close />);

    const chainlist = useCallback(
        (chains: Chain[] = []) =>
            chains?.map((chain: Chain) => {
                const chainId = valid.chainId(chain?.chainId) ? parseChainId(chain.chainId) : undefined;
                const selected = typeof activeChainId === "number" && typeof chainId === "number" && activeChainId === chainId;

                return {
                    style: { padding: responsive ? "2.5em clamp(2em, 5%, 8em)" : "2em 3em" },
                    onClick: !selected && (() => {}),
                    children: [
                        [
                            [
                                {
                                    style: { ...(selected && { opacity: 0.3, pointerEvents: "none" }) },
                                    onClick: () => {
                                        provider?.changeChain(chain?.chainId);
                                        onClose?.();
                                    },
                                    children: (
                                        <>
                                            <Layouts.Row gap={2}>
                                                <Layouts.Row gap={1} fit>
                                                    <Elements.Avatar img={chainLogo(chain?.chainId, chain?.logo)} />
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
                                                { icon: "plug", value: t("app.sidebar.chain.rpc.change") },
                                                { icon: "write", value: t("app.sidebar.chain.info.edit") },
                                                { icon: "bin", value: t("app.sidebar.chain.remove", { chain: chain?.chainName || "" }) },
                                            ]}
                                            onClickItem={(e: any, v: any, k: number) => {
                                                switch (k) {
                                                    case 0:
                                                        return openRpcChangeModal({ chain });
                                                    case 1:
                                                        return openChainEditModal({ chain });
                                                    case 2:
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
                };
            }),
        [activeChainId, onClose, openChainEditModal, openChainRemoveModal, openRpcChangeModal, provider, responsive, t, isMobile],
    );

    const [openChainAddModal, closeChainAddModal] = usePortal(() => <Modals.Add onClose={closeChainAddModal} />);

    return (
        <Layouts.Col gap={0} fill>
            {search}
            <Layouts.List list={filter(chains, searchFilter)} formatter={chainlist} />
            <Layouts.Col style={{ padding: "4em", paddingTop: "0" }} fit>
                <Controls.Button type={"line"} iconLeft={"plus-small-bold"} onClick={openChainAddModal}>
                    {t("app.sidebar.chain.add")}
                </Controls.Button>
            </Layouts.Col>
        </Layouts.Col>
    );
}
