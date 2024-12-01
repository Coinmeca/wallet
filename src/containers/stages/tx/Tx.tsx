"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { format, parseNumber } from "@coinmeca/ui/lib/utils";
import { useQueries } from "@tanstack/react-query";

import { query } from "api/onchain/query";
import { GetMaxFeePerGas } from "api/onchain";
import { sanitizeBigIntToHex, short } from "utils";
import { Asset, AssetType, zeroAddress } from "types";
import { Stage } from "..";
import { getQueryClient } from "api";
import { Style } from "./Tx.styled";

interface Tx extends Stage {
    asset?: Asset<any>;
    amount?: number;
    recipient?: string;
    onBack?: Function;
    onComplete?: Function;
}

export default function Tx(props: Tx) {
    const client = getQueryClient();
    const level = props?.stage?.level || 0;
    const asset = props?.asset;
    const amount = Number((Number(props?.amount || 0) * 10 ** (asset?.decimals || 1))?.toString()?.split(".")[0]);
    const recipient = props.recipient || "";

    const constrain = 200;
    const perspective = 200;

    const { provider, chain, account } = useCoinmecaWalletProvider();

    const [txHash, setTxHash] = useState<string>();
    const [error, setError] = useState<any>();
    const [transform, setTransform] = useState<string>("");

    const tx = useMemo(() => {
        return (
            (amount || asset?.tokenId) &&
            recipient &&
            recipient !== "" && {
                from: account?.address,
                to: asset?.address,
                data:
                    "0xa9059cbb" +
                    (recipient.startsWith("0x") ? recipient.slice(2) : recipient).toLowerCase().padStart(64, "0") +
                    (asset?.type === AssetType.ERC20 ? BigInt(amount) : BigInt(asset?.tokenId || 0)).toString(16).padStart(64, "0"),
            }
        );
    }, [asset?.address, recipient]);

    console.log({ tx });

    const [{ data: nonce }, { data: gasPrice, isLoading: isGasPriceLoading }, { data: estimateGas, isLoading: isEstimateGasLoading }] = useQueries({
        queries: [
            query.nonce(chain?.rpcUrls[0], account?.address),
            query.gasPrice(chain?.rpcUrls[0]),
            query.estimateGas(chain?.rpcUrls[0], sanitizeBigIntToHex(tx)),
        ],
    });

    const {
        data: { maxPriorityFeePerGas, maxFeePerGas },
    } = GetMaxFeePerGas(chain?.rpcUrls[0]);

    const gasFee = useMemo(
        () => ({
            raw: gasPrice?.raw ? gasPrice?.raw * (estimateGas?.raw || 1) : 0,
            format: gasPrice?.format ? gasPrice?.format * (estimateGas?.format || 1) : 0,
        }),
        [gasPrice?.format, estimateGas?.format],
    );

    const totalAmount = useMemo(
        () =>
            amount > gasFee.raw
                ? { raw: BigInt(amount) - BigInt(gasFee.raw), format: (amount - gasFee.raw) * 10 ** (chain?.nativeCurrency?.decimals || 1) }
                : { raw: BigInt(0), format: 0 },
        [amount, gasFee],
    );

    const transforms = (x: number, y: number, el: HTMLElement): string => {
        const box = el.getBoundingClientRect();
        const calcX = -(y - box.y - box.height / 2) / constrain;
        const calcY = (x - box.x - box.width / 2) / constrain;

        return `perspective(${perspective}px) rotateX(${calcX}deg) rotateY(${calcY}deg)`;
    };

    const mouseMoved = (e: MouseEvent, elementId: string) => {
        const object = document.getElementById(elementId);
        if (object) {
            const position: [number, number] = [e.clientX, e.clientY];
            window.requestAnimationFrame(() => setTransform(transforms(position[0], position[1], object)));
        }
    };
    const handleBack = () => {
        props?.onBack?.();
    };

    const handleGoToMain = () => {
        setTxHash(undefined);
        setError(undefined);
        props?.onComplete?.();
    };

    const handleSend = async () => {
        await provider
            ?.send(
                {
                    ...(asset?.address === zeroAddress
                        ? {
                              from: account?.address,
                              to: recipient,
                              value: `0x${totalAmount.raw.toString(16).padStart(64, "0")}`,
                          }
                        : { ...tx }),
                    chainId: Number(chain?.chainId),
                    nonce: BigInt(nonce || 0),
                    gasLimit: BigInt(estimateGas?.raw || 0),
                    gasPrice: BigInt(gasPrice?.raw || 0),
                    maxFeePerGas: BigInt(maxFeePerGas?.raw || 0),
                    maxPriorityFeePerGas: BigInt(maxPriorityFeePerGas?.raw || 0),
                } as any,
                account?.address!,
            )
            .then((result) => {
                switch (asset?.type) {
                    case AssetType.ERC20:
                        if (asset?.address && provider?.isInternalAccount(recipient)) provider?.addFungibleAsset(asset.address, recipient);
                        break;
                    case AssetType.ERC721:
                        if (asset?.address && asset?.tokenId && provider?.isInternalAccount(recipient)) {
                            provider?.removeNonFungibleAsset(asset.address, asset.tokenId, account?.address);
                            provider?.addNonFungibleAsset(asset.address, asset.tokenId, recipient);
                        }
                        break;
                }
                client.refetchQueries({ queryKey: [`${asset?.address}_token`] });
                setTxHash(result);
            })
            .catch((error) => setError(error));
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => mouseMoved(e, "token");
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    return (
        <Layouts.Contents.SlideContainer
            contents={[
                {
                    active: true,
                    children: (
                        <Layouts.Contents.InnerContent scroll={false}>
                            <Layouts.Col gap={2} align={"center"} fill>
                                <Layouts.Contents.InnerContent padding={[4, 4, 0]}>
                                    <Layouts.Col fill>
                                        <Layouts.Col align={"center"} style={{ flex: 1 }}>
                                            <Layouts.Col gap={8} align={"center"} fit>
                                                <Layouts.Contents.SlideContainer
                                                    contents={[
                                                        ...(asset?.type === AssetType.ERC721
                                                            ? [
                                                                  {
                                                                      active: !txHash && !error,
                                                                      style: {
                                                                          display: "flex",
                                                                          alignItems: "center",
                                                                          justifyContent: "center",
                                                                          overflow: "initial",
                                                                          paddingTop: "clamp(0em, 5%, 8em)",
                                                                      },
                                                                      children: (
                                                                          <Style>
                                                                              <Image
                                                                                  id="token"
                                                                                  width={0}
                                                                                  height={0}
                                                                                  src={asset?.image || ""}
                                                                                  alt={asset?.name || ""}
                                                                                  style={{
                                                                                      width: "100%",
                                                                                      height: "100%",
                                                                                      transition: "transform 0.1s ease-out",
                                                                                      transform,
                                                                                  }}
                                                                              />
                                                                              <div>
                                                                                  <div />
                                                                                  <div />
                                                                                  <div />
                                                                                  <div />
                                                                                  <div />
                                                                                  <div />
                                                                                  <div />
                                                                                  <div />
                                                                              </div>
                                                                          </Style>
                                                                      ),
                                                                  },
                                                              ]
                                                            : []),
                                                        {
                                                            active: asset?.type === AssetType.ERC20 || !!txHash || !!error,
                                                            style: { display: "flex", alignItems: "center", justifyContent: "center", overflow: "initial" },
                                                            children: (
                                                                <div
                                                                    style={{
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        justifyContent: "center",
                                                                        maxWidth: "max-content",
                                                                        maxHeight: "max-content",
                                                                        padding: "2em",
                                                                        borderRadius: "100%",
                                                                        background: "rgba(var(--white),.15)",
                                                                    }}>
                                                                    <Image
                                                                        width={0}
                                                                        height={0}
                                                                        src={
                                                                            !!txHash || !!error
                                                                                ? require(`../../../assets/animation/${
                                                                                      !!txHash ? "success" : !!error ? "failure" : "loading"
                                                                                  }.gif`)
                                                                                : `https://web3.coinmeca.net/${
                                                                                      chain?.chainId
                                                                                  }/${asset?.address?.toLowerCase()}/logo.svg`
                                                                        }
                                                                        alt={asset?.symbol || "Unknown"}
                                                                        style={{ width: "8em", height: "8em" }}
                                                                    />
                                                                </div>
                                                            ),
                                                        },
                                                    ]}
                                                />
                                                <Layouts.Col gap={1} align={"center"}>
                                                    <Layouts.Row gap={1} align={"center"} fit fix>
                                                        {asset?.type === AssetType.ERC721 && (
                                                            <Elements.Text type={"h6"} opacity={0.6} fix>
                                                                #
                                                            </Elements.Text>
                                                        )}
                                                        <Elements.Text type={"h6"} fix>
                                                            {asset?.type === AssetType.ERC20 ? asset?.symbol : asset?.tokenId || ""}
                                                        </Elements.Text>
                                                    </Layouts.Row>
                                                    <Elements.Text type={"strong"} opacity={0.6}>
                                                        {asset?.type === AssetType.ERC20 ? asset?.name : asset?.uri?.name || ""}
                                                    </Elements.Text>
                                                </Layouts.Col>
                                            </Layouts.Col>
                                        </Layouts.Col>
                                        <Layouts.Contents.SlideContainer
                                            style={{ flex: 1 }}
                                            contents={[
                                                {
                                                    active: level < 2,
                                                    children: <></>,
                                                },
                                                {
                                                    active: !txHash && !error && level === 2,
                                                    style: { display: "flex", minHeight: "max-content" },
                                                    children: (
                                                        <Layouts.Col gap={8} style={{ flex: 1, height: "100%", minHeight: "max-content" }} fill>
                                                            <Layouts.Col style={level === 2 ? { minHeight: "max-content" } : {}} reverse fill>
                                                                <Layouts.Box
                                                                    style={{
                                                                        "--white": "255,255,255",
                                                                        "--black": "0, 0, 0",
                                                                        background: "rgba(var(--white),.15)",
                                                                        maxHeight: "max-content",
                                                                        padding: "clamp(2em, 7.5%, 4em)",
                                                                        width: "auto",
                                                                        height: "auto",
                                                                    }}
                                                                    fit>
                                                                    <Layouts.Col gap={2} align={"left"}>
                                                                        <Layouts.Col gap={0.5}>
                                                                            <Elements.Text type={"desc"} weight={"bold"} opacity={0.6}>
                                                                                Gas Price
                                                                            </Elements.Text>
                                                                            <Elements.Text>
                                                                                {isGasPriceLoading
                                                                                    ? "~"
                                                                                    : format(gasPrice?.format, "currency", {
                                                                                          unit: 9,
                                                                                          limit: 12,
                                                                                          fix: 9,
                                                                                      })}
                                                                            </Elements.Text>
                                                                        </Layouts.Col>
                                                                        <Layouts.Col gap={0.5}>
                                                                            <Elements.Text type={"desc"} weight={"bold"} opacity={0.6}>
                                                                                Estimated Gas
                                                                            </Elements.Text>
                                                                            <Elements.Text>
                                                                                {isEstimateGasLoading
                                                                                    ? "~"
                                                                                    : format(estimateGas?.format, "currency", {
                                                                                          unit: 9,
                                                                                          limit: 12,
                                                                                          fix: 9,
                                                                                      })}
                                                                            </Elements.Text>
                                                                        </Layouts.Col>
                                                                        <Layouts.Col gap={0.5}>
                                                                            <Elements.Text type={"desc"} weight={"bold"} opacity={0.6}>
                                                                                Total
                                                                            </Elements.Text>
                                                                            <Layouts.Row gap={1} fix>
                                                                                <Elements.Text style={{ flex: "initial" }} fix>
                                                                                    {isGasPriceLoading || isEstimateGasLoading
                                                                                        ? "~"
                                                                                        : format(gasFee.format, "currency", {
                                                                                              unit: 9,
                                                                                              limit: 12,
                                                                                              fix: 9,
                                                                                          })}
                                                                                </Elements.Text>
                                                                                <Elements.Text opacity={0.6} fit>
                                                                                    {chain?.nativeCurrency?.symbol}
                                                                                </Elements.Text>
                                                                            </Layouts.Row>
                                                                        </Layouts.Col>
                                                                    </Layouts.Col>
                                                                </Layouts.Box>
                                                            </Layouts.Col>
                                                        </Layouts.Col>
                                                    ),
                                                },
                                                {
                                                    active: !!txHash,
                                                    children: (
                                                        <Layouts.Col gap={0} align={"center"} style={{ height: "100%" }} fill>
                                                            <Layouts.Col gap={4} align={"center"} fit>
                                                                <Elements.Text type={"h3"}>Complete</Elements.Text>
                                                                <Elements.Text size={1} weight={"bold"}>
                                                                    <Elements.Text opacity={0.6}>Complete to connect</Elements.Text>{" "}
                                                                    <Elements.Text>{account?.name}</Elements.Text>{" "}
                                                                    <Elements.Text opacity={0.6}>({short(account?.address)}) to</Elements.Text>{" "}
                                                                    <Elements.Text>{asset?.symbol}</Elements.Text>{" "}
                                                                    <Elements.Text opacity={0.6}>({asset?.name}).</Elements.Text>
                                                                </Elements.Text>
                                                            </Layouts.Col>
                                                        </Layouts.Col>
                                                    ),
                                                },
                                                {
                                                    active: !!error,
                                                    children: (
                                                        <Layouts.Col gap={0} align={"center"} style={{ height: "100%" }} fill>
                                                            <Layouts.Col gap={4} align={"center"} fit>
                                                                <Elements.Text type={"h3"}>Failure</Elements.Text>
                                                                <Elements.Text weight={"bold"} opacity={0.6}>
                                                                    {error?.message || error}
                                                                </Elements.Text>
                                                            </Layouts.Col>
                                                        </Layouts.Col>
                                                    ),
                                                },
                                            ]}
                                        />
                                        {/* </Layouts.Col> */}
                                    </Layouts.Col>
                                </Layouts.Contents.InnerContent>
                                <Layouts.Col gap={4} align={"center"} style={{ padding: "4em", paddingTop: 0 }}>
                                    <Layouts.Contents.SlideContainer
                                        contents={[
                                            {
                                                active: level === 1,
                                                children: <></>,
                                            },
                                            {
                                                active: !txHash && !error && level === 2,
                                                children: (
                                                    <Layouts.Row gap={2}>
                                                        <Controls.Button type={"glass"} onClick={handleBack}>
                                                            Cancel
                                                        </Controls.Button>
                                                        <Controls.Button type={"line"} onClick={handleSend}>
                                                            Send
                                                        </Controls.Button>
                                                    </Layouts.Row>
                                                ),
                                            },
                                            {
                                                active: !!txHash || !!error,
                                                children: (
                                                    <Layouts.Row gap={2}>
                                                        <Controls.Button type={"glass"} onClick={handleGoToMain}>
                                                            Go to main
                                                        </Controls.Button>
                                                    </Layouts.Row>
                                                ),
                                            },
                                        ]}
                                    />
                                </Layouts.Col>
                            </Layouts.Col>
                        </Layouts.Contents.InnerContent>
                    ),
                },
            ]}
        />
    );
}
