"use client";

import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { usePortal, useSort } from "@coinmeca/ui/hooks";
import { parseChainId } from "@coinmeca/wallet-provider/chains";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { GetErc721 } from "api/erc721";
import Image from "next/image";
import { filter } from "@coinmeca/ui/lib/utils";
import { Asset } from "types";
import styled from "styled-components";
import { Root } from "@coinmeca/ui/lib/style";
import { useCallback, useMemo } from "react";
import { NonFungible as Modals } from "containers/modals";
import { useTranslate } from "hooks";
import { valid } from "utils";

interface Nft {
    filter?: string;
    onSelect?: Function;
}

const AddNewButton = styled.div<{ $only?: boolean }>`
    width: 100%;
    height: 100%;
    display: flex;
    scroll-snap-type: y mandatory;
    -webkit-overflow-scrolling: "touch";
    ${({ $only }) => $only && "aspect-ratio: 1/1.25;"}

    & > * {
        flex: 1;
    }

    @media all and (max-width: ${Root.Device.Tablet}px) {
        &:nth-child(odd):last-child:not(:only-child) {
            width: 200%;
            height: 200%;
            aspect-ratio: initial;

            & > * {
                display: flex;
                align-items: center;
                justify-content: center;

                & > * {
                    & > * {
                        flex-direction: row;
                        max-width: max-content;

                        & > * {
                            max-width: max-content;
                        }
                    }
                }
            }
        }
    }

    @media all and (max-width: ${Root.Device.Small}px) {
        &:nth-child(odd):last-child:not(:only-child) {
            width: 100%;
            height: 100%;
            aspect-ratio: 1/1;

            & > * {
                display: flex;
                align-items: center;
                justify-content: center;

                & > * {
                    & > * {
                        flex-direction: column;
                        max-width: initial;

                        & > * {
                            max-width: max-content;
                        }
                    }
                }
            }
        }
    }
`;

export default function Nft(props: Nft) {
    const { provider, tokens } = useCoinmecaWalletProvider();
    const { sorting, sortArrow, setSort } = useSort();
    const { t } = useTranslate();
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

    const [nonFungibles] = GetErc721(activeChain?.rpcUrls?.[0], tokens?.nonFungibles ? Object.values(tokens?.nonFungibles) : []);
    const nftlist = Object.values(nonFungibles)?.flatMap((v) => Object.values(v));

    const [openNonFungibleAdd, closeNonFungibleAdd] = usePortal(() => <Modals.Add onClose={closeNonFungibleAdd} />);
    const [openNonFungibleInfo, closeNonFungibleInfo] = usePortal((info: any) => (
        <Modals.Info {...info} onTransfer={handleTransfer} onClose={closeNonFungibleInfo} />
    ));

    const sorts = {
        name: { key: "name", type: "string" },
        address: { key: "address", type: "string" },
        id: { key: "balance", type: "number" },
    };

    const handleTransfer = (asset: Asset<"ERC721">) => {
        props?.onSelect?.(asset);
    };

    const items = useMemo(() => filter(sorting(nftlist), props?.filter), [nftlist, props?.filter]);

    return (
        <Layouts.Contents.InnerContent>
            <Layouts.Row gap={1} fix style={{ overflow: "auto hidden" }}>
                <Layouts.Row gap={0} fix>
                    <Controls.Tab iconLeft={sortArrow(sorts.name)} onClick={() => setSort(sorts.name)}>
                        {t("asset.name")}
                    </Controls.Tab>
                    <Controls.Tab iconLeft={sortArrow(sorts.address)} onClick={() => setSort(sorts.address)}>
                        {t("asset.address")}
                    </Controls.Tab>
                    <Controls.Tab iconLeft={sortArrow(sorts.id)} onClick={() => setSort(sorts.id)}>
                        {t("asset.token.id")}
                    </Controls.Tab>
                </Layouts.Row>
            </Layouts.Row>
            <Layouts.Divider />
            <Layouts.Contents.InnerContent>
                <Layouts.Contents.GridContainer
                    direction={"row"}
                    width={items.length ? { min: "clamp(20em, 50%, 40em)" } : undefined}
                    style={{ overflow: "initial", height: "100%" }}
                    scroll={false}
                    fullsize={!items.length}>
                    {items.map((nft: any, i: number) => (
                        <Controls.Card
                            key={i}
                            onClick={() => openNonFungibleInfo(nft)}
                            style={{
                                scrollSnapType: "y mandatory",
                                "-webkit-overflow-scrolling": "touch",
                                height: "initial",
                                aspectRatio: "0.8/1",
                            }}>
                            <div>
                                <Image
                                    width={0}
                                    height={0}
                                    src={nft?.isLoading ? require("../../assets/animation/loading.gif") : nft?.data?.image}
                                    alt={nft?.data?.uri?.name || ""}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        aspectRatio: "1/1",
                                    }}
                                />
                            </div>
                            <Layouts.Col gap={1}>
                                <Elements.Text fix>{nft?.data?.uri?.name}</Elements.Text>
                                <Elements.Text align={"right"} fix>
                                    <Elements.Text size={1} opacity={0.3}>
                                        #{" "}
                                    </Elements.Text>
                                    {nft?.data?.tokenId}
                                </Elements.Text>
                            </Layouts.Col>
                        </Controls.Card>
                    ))}
                    <AddNewButton $only={!!items.length}>
                        <Controls.Card onClick={openNonFungibleAdd} style={{ height: "100%" }}>
                            <Layouts.Col align={"center"} fill>
                                <Layouts.Col gap={2} align={"center"}>
                                    <Elements.Icon
                                        scale={0.666}
                                        icon={"plus-bold"}
                                        style={{ padding: "0.5em", borderRadius: "100%", border: "0.1em solid rgb(var(--white))" }}
                                    />
                                    <Layouts.Row gap={1} align={"center"}>
                                        <Elements.Text>{t("asset.token.add")}</Elements.Text>
                                    </Layouts.Row>
                                </Layouts.Col>
                            </Layouts.Col>
                        </Controls.Card>
                    </AddNewButton>
                </Layouts.Contents.GridContainer>
            </Layouts.Contents.InnerContent>
        </Layouts.Contents.InnerContent>
    );
}
