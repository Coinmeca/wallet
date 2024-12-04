"use client";

import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { usePortal, useSort } from "@coinmeca/ui/hooks";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { Modals } from "containers";
import { GetErc721 } from "api/erc721";
import Image from "next/image";
import { filter } from "@coinmeca/ui/lib/utils";
import { Asset } from "types";
import styled from "styled-components";
import { Root } from "@coinmeca/ui/lib/style";

interface Nft {
    filter?: string;
    onSelect?: Function;
}

const AddNewButton = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    scroll-snap-type: y mandatory;
    -webkit-overflow-scrolling: "touch";
    aspect-ratio: 1/1.25;

    & > * {
        flex: 1;
    }

    @media all and (max-width: ${Root.Device.Tablet}px) {
        &:nth-child(odd):last-child {
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
        &:nth-child(odd):last-child {
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
    const { chain, tokens } = useCoinmecaWalletProvider();
    const { sorting, sortArrow, setSort } = useSort();

    const [nonFungibles] = GetErc721(chain?.rpcUrls?.[0], tokens?.nonFungibles ? Object.values(tokens?.nonFungibles) : []);
    const nftlist = Object.values(nonFungibles)?.flatMap((v) => Object.values(v));

    const [openNonFungibleAdd, closeNonFungibleAdd] = usePortal(() => <Modals.NonFungible.Add onClose={closeNonFungibleAdd} />);
    const [openNonFungibleInfo, closeNonFungibleInfo] = usePortal((info: any) => (
        <Modals.NonFungible.Info {...info} onTransfer={handleTransfer} onClose={closeNonFungibleInfo} />
    ));

    const sorts = {
        name: { key: "name", type: "string" },
        address: { key: "address", type: "string" },
        id: { key: "balance", type: "number" },
    };

    const handleTransfer = (asset: Asset<"ERC721">) => {
        props?.onSelect?.(asset);
    };

    return (
        <Layouts.Contents.InnerContent>
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
            <Layouts.Contents.InnerContent>
                <Layouts.Contents.GridContainer direction={"row"} width={{ min: "clamp(20em, 50%, 40em)" }} style={{ overflow: "initial" }} scroll={false}>
                    {filter(sorting(nftlist), props?.filter)?.map((nft: any, i: number) => (
                        <Controls.Card
                            key={i}
                            onClick={() => openNonFungibleInfo(nft)}
                            style={{
                                scrollSnapType: "y mandatory",
                                "-webkit-overflow-scrolling": "touch",
                                height: "initial",
                                aspectRatio: "1/1.25",
                            }}>
                            <div style={{}}>
                                <Image
                                    width={0}
                                    height={0}
                                    src={nft?.isLoading ? require("../../assets/animation/loading.gif") : nft?.data?.image}
                                    alt={nft?.data?.uri || "Unknown"}
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
                    <AddNewButton>
                        <Controls.Card onClick={openNonFungibleAdd}>
                            <Layouts.Col gap={1} align={"center"}>
                                <Elements.Icon
                                    scale={0.666}
                                    icon={"plus-bold"}
                                    style={{ padding: "0.5em", borderRadius: "100%", border: "0.1em solid rgb(var(--white))" }}
                                />
                                <Layouts.Row gap={1} align={"center"}>
                                    <Elements.Text>Add a new token</Elements.Text>
                                </Layouts.Row>
                            </Layouts.Col>
                        </Controls.Card>
                    </AddNewButton>
                </Layouts.Contents.GridContainer>
            </Layouts.Contents.InnerContent>
        </Layouts.Contents.InnerContent>
    );
}
