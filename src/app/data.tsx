"use client";

import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { useNotification, usePortal, useWindowSize } from "@coinmeca/ui/hooks";
import { Avatar } from "@coinmeca/ui/components/elements";
import { Account, App, Chain } from "@coinmeca/wallet-sdk/types";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";

import Coinmeca from "assets/coinmeca.svg";
import { usePageLoader } from "hooks";
import { filter, format } from "@coinmeca/ui/lib/utils";
import { Modal } from "@coinmeca/ui/containers";
import { Root } from "@coinmeca/ui/lib/style";
import { useQueries } from "@tanstack/react-query";
import { query } from "api/onchain/query";

export default function Data() {
    const router = useRouter();
    const path = usePathname();

    const { windowSize } = useWindowSize();
    const { isLoad } = usePageLoader();
    const { provider, account, accounts, chain, chains, apps } = useCoinmecaWalletProvider();
    const { toasts, addToast } = useNotification();

    const [value, setValue] = useState<number>(0);
    const [tab, setTab] = useState<string>("icon");
    const [active, setActive] = useState(false);
    const [mobileMenu, setMobileMenu] = useState("");
    const [setting, setSetting] = useState("");

    const [accountFilter, setAccountFilter] = useState<string>();
    const [chainFilter, setChainFilter] = useState<string>();
    const [appFilter, setAppFilter] = useState<string>();

    const isRequest = useMemo(() => path?.startsWith("/request"), [path]);

    const balance = useQueries({
        queries: (accounts || [])?.map((a) => query.balance(chain?.rpcUrls?.[0], a?.address)),
    });

    const colorMap = path?.startsWith("/asset") ? "red" : path?.startsWith("/exchange") ? "orange" : path?.startsWith("/treasury") ? "blue" : "var(--rainbow)";

    const responsive = windowSize.width <= Root.Device.Tablet;
    const languages = [
        {
            code: "en",
            value: "English",
        },
        {
            code: "sp",
            value: "Español",
        },
        {
            code: "cn",
            value: "中文",
        },
        {
            code: "jp",
            value: "日本語",
        },
        {
            code: "ar",
            value: "عربي",
        },
        {
            value: "한국어",
            code: "ko",
        },
    ];

    const handleAccountChange = (account: Account) => {
        provider?.changeAccount(account?.index);
        setMobileMenu("");
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

    const AccountModal = (props: any) => {
        return <Modal {...props} onClose={closeAccountModal} />;
    };
    const [openAccountModal, closeAccountModal] = usePortal((props: any) => <AccountModal {...props} />);

    const accountlist = useCallback(
        (accounts: Account[] = []) => {
            if (accounts?.length) {
                return accounts.map((a: Account, i: number) => {
                    const selected = account?.address?.toLowerCase() === a?.address?.toLowerCase();
                    return {
                        onClick: !selected && (() => {}),
                        style: { padding: "2.5em clamp(2em, 5%, 8em)", ...(selected && { background: "transparent", pointerEvents: "none" }) },
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
                                                                            {a?.address?.substring(0, a?.address?.startsWith("0x") ? 8 : 6) +
                                                                                " ... " +
                                                                                a?.address?.substring(a?.address?.length - 6, a?.address?.length)}
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
                                                children: [],
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
                                                                { icon: "x", value: `Delete This ${a?.name}` },
                                                            ]}
                                                            onClickItem={(e: any, v: any, k: number) => {
                                                                console.log(k);
                                                            }}
                                                            responsive={responsive}
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
                });
            }
        },
        [account, accounts, balance],
    );

    const applist = useCallback(
        (apps: Account[] = []) => {
            if (apps?.length) {
                return apps.map((app: App) => {
                    return {
                        onClick: () => {},
                        style: { padding: "2.5em clamp(2em, 5%, 8em)" },
                        children: [
                            [
                                [
                                    {
                                        style: { overflow: "hidden" },
                                        children: [
                                            {
                                                gap: 2,
                                                // style: selected ? { opacity: 0.3 } : {},
                                                // onClick: () => handleAccountChange(a),
                                                children: [
                                                    {
                                                        fit: true,
                                                        children: (
                                                            <Image
                                                                width={32}
                                                                height={32}
                                                                // color={colorMap}
                                                                // scale={1.25}
                                                                // size={2.5}
                                                                // display={6}
                                                                // ellipsis={" ... "}
                                                                src={app?.logo || ""}
                                                                alt={app?.name || ""}
                                                            />
                                                        ),
                                                    },
                                                    {
                                                        gap: 0,
                                                        children: [
                                                            <>
                                                                <Elements.Text size={1.5} height={1.5} title={app?.name} fix>
                                                                    {app?.name}
                                                                </Elements.Text>
                                                            </>,
                                                            <>
                                                                <Elements.Text size={1.375} height={1.5} weight={"light"} opacity={0.6} title={app?.url} fix>
                                                                    {app?.url}
                                                                </Elements.Text>
                                                            </>,
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
                                                    <>{/* <Controls.Button icon={"copy"} onClick={() => handleCopyAddress(a)} /> */}</>,
                                                    <>
                                                        <Controls.Dropdown
                                                            type={"more"}
                                                            options={[
                                                                { icon: "copy", value: "Edit Allowed Accounts" },
                                                                { icon: "power", value: `Delete This ${account?.name}` },
                                                            ]}
                                                            onClickItem={(e: any, v: any, k: number) => {
                                                                console.log(k);
                                                            }}
                                                            responsive={responsive}
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
                });
            }
        },
        [apps],
    );

    const chainlist = useCallback(
        (chains: Chain[] = []) => {
            if (chains?.length) {
                return chains.map((c: Chain) => ({
                    onClick: () => {
                        provider?.changeChain(c?.chainId);
                        setMobileMenu("");
                    },
                    style: { padding: "2.5em clamp(2em, 5%, 8em)", ...(provider?.chain?.chainId === c?.chainId && { opacity: 0.3, pointerEvents: "none" }) },
                    children: [
                        [
                            {
                                children: (
                                    <Layouts.Row gap={2}>
                                        <Layouts.Row gap={1} fit>
                                            <Avatar img={c?.logo || ""} />
                                            {/* <Avatar img={`https://web3.coinmeca.net/${c?.chainId}/logo.svg`} /> */}
                                        </Layouts.Row>
                                        <Elements.Text size={1.5}>{c?.chainName}</Elements.Text>
                                    </Layouts.Row>
                                ),
                            },
                        ],
                    ],
                }));
            }
        },
        [chain, chains],
    );

    console.log(isRequest, !isLoad, !account);

    const header = {
        color: colorMap,
        logo: isRequest || !isLoad || !account,
        menu:
            !isRequest && isLoad && account
                ? {
                      active: mobileMenu === "menu",
                      onClick: () => (mobileMenu === "menu" ? setMobileMenu("") : setMobileMenu("menu")),
                      children: [
                          {
                              name: "Activity",
                              href: "/activity",
                              onClick: () => setMobileMenu(""),
                          },
                          {
                              name: "Token",
                              href: "/token",
                              onClick: () => setMobileMenu(""),
                          },
                          {
                              name: "NFT",
                              href: "/nft",
                              onClick: () => setMobileMenu(""),
                          },
                          {
                              name: "Test",
                              href: "/test",
                              onClick: () => setMobileMenu(""),
                          },
                      ],
                  }
                : undefined,
        // option: {
        //     active: true,
        //     children: (
        //     ),
        // },
        side:
            !isRequest && isLoad && account
                ? {
                      width: 48,
                      active: true,
                      // style: { ...(windowWidth <= Root.Device.Tablet && isMobile && { flexDirection: "column-reverse" }) },
                      children: (
                          <>
                              {/* <Controls.Tab
                        onClick={() => {
                            if (!sidebar && mobileMenu !== "") setMobileMenu("");
                            setSidebar(!sidebar);
                        }}
                        active={sidebar}
                        iconLeft={"sidebar"}
                        hide={"desktop"}
                        toggle
                        fit
                    /> */}
                              <Layouts.Row fit>
                                  {account?.address && (
                                      <Layouts.Row gap={0} fit>
                                          <Controls.Tab
                                              active={mobileMenu === "accounts"}
                                              onClick={() => setMobileMenu(mobileMenu === "accounts" ? "" : "accounts")}
                                              toggle>
                                              {mobileMenu === "accounts" ? (
                                                  <Layouts.Row gap={0.5} align={"middle"}>
                                                      <Elements.Icon icon={"x"} scale={0.666} />
                                                      <Elements.Text size={1}>Close Account List</Elements.Text>
                                                  </Layouts.Row>
                                              ) : (
                                                  <Elements.Avatar
                                                      // color={colorMap}
                                                      scale={0.666}
                                                      size={2.5}
                                                      display={6}
                                                      ellipsis={" ... "}
                                                      character={`${account?.index + 1}`}
                                                      name={account?.address}
                                                  />
                                              )}
                                          </Controls.Tab>
                                          {mobileMenu !== "accounts" && (
                                              <Controls.Button icon={"copy"} title={"Copy address"} onClick={() => handleCopyAddress(account)} />
                                          )}
                                      </Layouts.Row>
                                  )}
                              </Layouts.Row>
                              <Layouts.Row gap={0} align={"right"}>
                                  <Controls.Tab
                                      active={mobileMenu === "chains"}
                                      onClick={() => setMobileMenu(mobileMenu === "chains" ? "" : "chains")}
                                      toggle
                                      fit>
                                      {mobileMenu === "chains" ? (
                                          <Elements.Icon icon={"x"} scale={0.666} />
                                      ) : (
                                          <Elements.Avatar scale={0.666} size={2.5} img={chain?.logo || ""} />
                                          // <Elements.Avatar scale={0.666} size={2.5} img={`https://web3.coinmeca.net/${chain?.chainId}/logo.svg`} />
                                      )}
                                  </Controls.Tab>
                                  <Controls.Tab
                                      active={mobileMenu === "setting"}
                                      onClick={() => setMobileMenu(mobileMenu === "setting" ? "" : "setting")}
                                      iconLeft={"gear"}
                                      show={"tablet"}
                                      toggle
                                      fit
                                  />
                              </Layouts.Row>
                          </>
                      ),
                  }
                : undefined,
        panels:
            !isRequest && isLoad
                ? [
                      {
                          active: mobileMenu === "accounts",
                          children: (
                              <Layouts.Col gap={0} fill>
                                  <Controls.Input
                                      placeholder={"Search chain by id or name..."}
                                      onChange={(e: any, v: string) => setAccountFilter(v)}
                                      left={{ children: <Elements.Icon icon={"search"} style={{ marginRight: "0.5em", padding: "0.333em 0" }} /> }}
                                      style={{ padding: "1.5em clamp(0em, 3.75%, 6em)" }}
                                      clearable
                                  />
                                  <Layouts.List list={filter(accounts, accountFilter)} formatter={accountlist} />
                                  <Layouts.Col style={{ padding: "4em", paddingTop: "0" }} fit>
                                      <Controls.Button
                                          type={"line"}
                                          iconLeft={"plus-small-bold"}
                                          onClick={() => {
                                              router.push("/create");
                                          }}>
                                          Create or Import wallet
                                      </Controls.Button>
                                  </Layouts.Col>
                              </Layouts.Col>
                          ),
                      },
                      {
                          active: mobileMenu === "chains",
                          children: (
                              <Layouts.Col gap={0} fill>
                                  <Controls.Input
                                      placeholder={"Search chain by id or name..."}
                                      onChange={(e: any, v: string) => setChainFilter(v)}
                                      left={{ children: <Elements.Icon icon={"search"} style={{ marginRight: "0.5em", padding: "0.333em 0" }} /> }}
                                      style={{ padding: "1.5em clamp(0em, 3.75%, 6em)" }}
                                      clearable
                                  />
                                  <Layouts.List list={filter(chains, chainFilter)} formatter={chainlist} />
                                  <Layouts.Col style={{ padding: "4em", paddingTop: "0" }} fit>
                                      <Controls.Button
                                          type={"line"}
                                          iconLeft={"plus-small-bold"}
                                          onClick={() => {
                                              // router.push("/create");
                                          }}>
                                          Add new chain
                                      </Controls.Button>
                                  </Layouts.Col>
                              </Layouts.Col>
                          ),
                      },
                      {
                          active: mobileMenu === "setting",
                          children: (
                              <Layouts.Contents.SlideContainer
                                  contents={[
                                      {
                                          active: setting === "",
                                          children: (
                                              <Layouts.Col style={{ padding: "4em" }} reverse fill>
                                                  <Layouts.Col gap={6}>
                                                      <Layouts.Col gap={6}>
                                                          <Controls.Button scale={1.125} style={{ padding: "0.5em 1em" }} onClick={() => router.push("/test")}>
                                                              Test
                                                          </Controls.Button>
                                                          <Controls.Button scale={1.125} style={{ padding: "0.5em 1em" }} onClick={() => setSetting("apps")}>
                                                              Connected Apps
                                                          </Controls.Button>
                                                          <Controls.Button scale={1.125} style={{ padding: "0.5em 1em" }} onClick={() => router.push("/reset")}>
                                                              Reset Passcode
                                                          </Controls.Button>
                                                      </Layouts.Col>
                                                      <Controls.Button
                                                          type={"line"}
                                                          scale={1.125}
                                                          style={{ padding: "0.5em 1em" }}
                                                          onClick={() => {
                                                              provider?.lock();
                                                              router.push("/lock");
                                                          }}>
                                                          Lock
                                                      </Controls.Button>
                                                  </Layouts.Col>
                                              </Layouts.Col>
                                          ),
                                      },
                                      {
                                          active: setting === "apps",
                                          children: (
                                              <Layouts.Contents.InnerContent scroll={false}>
                                                  <Layouts.Col gap={0} fill>
                                                      <Controls.Input
                                                          placeholder={"Search chain by id or name..."}
                                                          onChange={(e: any, v: string) => setAppFilter(v)}
                                                          left={{
                                                              children: (
                                                                  <Elements.Icon icon={"search"} style={{ marginRight: "0.5em", padding: "0.333em 0" }} />
                                                              ),
                                                          }}
                                                          style={{ padding: "1.5em clamp(0em, 3.75%, 6em)" }}
                                                          clearable
                                                      />
                                                      <Layouts.List list={filter(apps, appFilter)} formatter={applist} />
                                                  </Layouts.Col>
                                                  <Layouts.Col gap={0} style={{ padding: "4em", paddingTop: "2em" }}>
                                                      <Layouts.Row>
                                                          <Controls.Button type={"glass"} onClick={() => setSetting("")}>
                                                              Back
                                                          </Controls.Button>
                                                      </Layouts.Row>
                                                  </Layouts.Col>
                                              </Layouts.Contents.InnerContent>
                                          ),
                                      },
                                  ]}
                              />
                          ),
                      },
                  ]
                : undefined,
    };

    const footer = {
        logo: {
            href: "",
            src: <Coinmeca height={"6em"} />,
            style: { maxWidth: "16em" },
        },
        menus: [
            {
                gap: 2,
                children: [
                    // {
                    //     href: `/asset/${chain?.id || "-"}`,
                    //     name: "Asset",
                    // },
                ],
            },
        ],
        side: {
            gap: 2,
            fit: true,
            children: [
                {
                    gap: 0,
                    children: [
                        <>
                            <Controls.Button icon={"discord"} title={"Discord"} fit />
                        </>,
                        <>
                            <Controls.Button icon={"twitter"} title={"X"} fit />
                        </>,
                        <>
                            <Controls.Button icon={"telegram"} title={"Telegram"} fit />
                        </>,
                        <>
                            <Controls.Button icon={"book"} title={"Documents"} fit />
                        </>,
                        <>
                            <Controls.Button icon={"medium"} title={"Medium"} fit />
                        </>,
                    ],
                },
                [
                    <>
                        <Controls.Button type={"line"}>Contact us</Controls.Button>
                    </>,
                ],
            ],
        },
        bottom: "Copyright © 2024 Coinmeca. All rights reserved.",
    };

    const toastlist = {
        active: toasts && toasts?.length > 0 && mobileMenu !== "notify",
        list: toasts,
        swipe: true,
    };

    return {
        value,
        setValue,
        tab,
        setTab,
        active,
        setActive,
        header,
        footer,
        toastlist,
    };
}
