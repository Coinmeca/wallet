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
import { filter, format } from "@coinmeca/ui/lib/utils";
import { Root } from "@coinmeca/ui/lib/style";
import { useQueries } from "@tanstack/react-query";
import { query } from "api/onchain/query";
import { Modals } from "containers";
import { PageLoader } from "hooks/usePageLoader";
import { short } from "utils";

export default function Data({isLoad, isRequest, isProxy, isMenu}: PageLoader) {
    const router = useRouter();
    const path = usePathname();

    const { windowSize } = useWindowSize();
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
    const [showDisabledAccount, setShowDisabledAccount] = useState<boolean>(false);

    const responsive = useMemo(() => windowSize.width <= Root.Device.Tablet, [windowSize]);

    const balance = useQueries({
        queries: (accounts || [])?.map((a) => query.balance(chain?.rpcUrls?.[0], a?.address)),
    });

    const colorMap = responsive
        ? "var(--rainbow)"
        : provider?.isLocked || path?.startsWith("/request")
        ? "var(--rainbow)"
        : path?.startsWith("/token")
        ? "orange"
        : path?.startsWith("/nft")
        ? "green"
        : path?.startsWith("/activity")
        ? "blue"
        : "var(--rainbow)";

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

    const handleMobileMenu = (menu: string) => {
        setMobileMenu(menu);
        if (responsive) {
            setAccountFilter("");
            setChainFilter("");
            setSetting("");
        }
    };

    const handleAccountChange = (account: Account) => {
        provider?.changeAccount(account?.index);
        handleMobileMenu("");
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

    const [openAccountEditModal, closeAccountEditModal] = usePortal((props: any) => <Modals.Account.Edit {...props} onClose={() => closeAccountEditModal()} />);

    const handleShowPrivateKey = (index: number) => {};

    const handleAccountEdit = (a: Account) => {
        openAccountEditModal({ account: a });
    };

    const handleAccountState = (a: Account) => {
        provider?.changeAccountInfo({ ...a, disable: !a?.disable });
    };

    const [openApprovalManage, closeApprovalManage] = usePortal((props: any) => <Modals.App.Approval {...props} onClose={() => closeApprovalManage()} />);

    const handleApprovalManage = (app: App) => {
        !!app && openApprovalManage({ app });
    };

    const [openAppRevoke, closeAppRevoke] = usePortal((props: any) => <Modals.App.Revoke {...props} onClose={() => closeAppRevoke()} />);
    const handleRevokeApp = (url?: string) => {
        openAppRevoke({ url });
    };

    const accountlist = useCallback(
        (accounts: Account[] = []) =>
            (showDisabledAccount ? accounts : accounts.filter((a) => !a?.disable)).map((a: Account, i: number) => {
                const selected = account?.address?.toLowerCase() === a?.address?.toLowerCase();
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
                                                            a?.disable
                                                                ? { icon: "show", value: `Enable ${a?.name}` }
                                                                : { icon: "hide", value: `Disable ${a?.name}` },
                                                        ]}
                                                        onClickItem={(e: any, v: any, k: number) => {
                                                            switch (k) {
                                                                case 0:
                                                                    return handleShowPrivateKey(a?.index);
                                                                case 1:
                                                                    return handleAccountEdit(a);
                                                                case 2:
                                                                    return handleAccountState(a);
                                                                default:
                                                                    return;
                                                            }
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
            }),
        [account, accounts, balance, showDisabledAccount],
    );

    const applist = useCallback(
        (apps: Account[] = []) =>
            apps.map((app: App) => ({
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
                                                        { icon: "identity", value: "Manage approvals" },
                                                        { icon: "power", value: `Revoke ${app?.name}` },
                                                    ]}
                                                    onClickItem={(e: any, v: any, k: number) => {
                                                        switch (k) {
                                                            case 0:
                                                                return handleApprovalManage(app);
                                                            case 1:
                                                                return handleRevokeApp(app?.url);
                                                        }
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
            })),
        [apps],
    );

    const chainlist = useCallback(
        (chains: Chain[] = []) =>
            chains?.map((c: Chain) => ({
                style: {
                    padding: responsive ? "2.5em clamp(2em, 5%, 8em)" : "2em 3em",
                    ...(provider?.chain?.chainId === c?.chainId && { opacity: 0.3, pointerEvents: "none" }),
                },
                onClick: () => {
                    provider?.changeChain(c?.chainId);
                    handleMobileMenu("");
                },
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
            })),
        [chain, chains],
    );

    const side = 56;
    const header = {
        color: colorMap,
        logo: windowSize?.width > Root.Device.Tablet || isRequest || !isLoad || !account,
        menu:
            !isRequest && isLoad && account
                ? {
                      active: mobileMenu === "menu",
                      onClick: () => (mobileMenu === "menu" ? handleMobileMenu("") : handleMobileMenu("menu")),
                      children: [
                          {
                              name: "Activity",
                              href: "/activity",
                              onClick: () => handleMobileMenu(""),
                          },
                          {
                              name: "Token",
                              href: "/token",
                              onClick: () => handleMobileMenu(""),
                          },
                          {
                              name: "NFT",
                              href: "/nft",
                              onClick: () => handleMobileMenu(""),
                          },
                          {
                              name: "Test",
                              href: "/test",
                              onClick: () => handleMobileMenu(""),
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
                      width: side - (responsive ? 8 : 5),
                      active: true,
                      style: !responsive ? { paddingRight: "1em" } : undefined,
                      children: (
                          <>
                              <Layouts.Row fit>
                                  {account?.address && (
                                      <Layouts.Row gap={0} fit>
                                          <Controls.Tab
                                              active={mobileMenu === "accounts"}
                                              onClick={() => handleMobileMenu(mobileMenu === "accounts" ? "" : "accounts")}
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
                                      onClick={() => handleMobileMenu(mobileMenu === "chains" ? "" : "chains")}
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
                                      onClick={() => handleMobileMenu(mobileMenu === "setting" ? "" : "setting")}
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
            responsive && !isRequest && isLoad
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
                                      {accounts?.filter((a) => a?.disable)?.length ? (
                                          <Controls.Button
                                              iconLeft={showDisabledAccount ? "hide" : "show"}
                                              onClick={() => setShowDisabledAccount(!showDisabledAccount)}>
                                              {showDisabledAccount ? "Hide" : "Show"} disabled accounts
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
                                                          <Controls.Button
                                                              scale={1.125}
                                                              style={{ padding: "0.5em 1em" }}
                                                              onClick={() => router.push("/change")}>
                                                              Change Passcode
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

    const sidebars =
        !responsive && !isRequest && isLoad && !provider?.isLocked
            ? {
                  active: true,
                  lower: {
                      width: 48,
                      onBlur: (e: any) => {
                          console.log("e", e);
                          if (!e.currentTarget.contains(e.relatedTarget)) {
                              // setSidebar(false);
                          }
                      },
                      active: !!mobileMenu && mobileMenu !== "",
                      swipe: {
                          style: { marginTop: "5em" },
                          //   onActive: (e: any, active: boolean) => setSidebar(active),
                      },
                      children: [
                          {
                              active: mobileMenu === "accounts",
                              children: (
                                  <Layouts.Col gap={0} fill>
                                      <Controls.Input
                                          placeholder={"Search chain by id or name..."}
                                          onChange={(e: any, v: string) => setAccountFilter(v)}
                                          left={{ children: <Elements.Icon icon={"search"} style={{ marginRight: "0.5em", padding: "0.333em 0" }} /> }}
                                          style={{ padding: "0.25em 2.5em" }}
                                          clearable
                                      />
                                      <Layouts.List list={filter(accounts, accountFilter)} formatter={accountlist} />
                                      <Layouts.Col style={{ padding: "4em", paddingTop: "0" }} fit>
                                          {accounts?.filter((a) => a?.disable)?.length ? (
                                              <Controls.Button
                                                  iconLeft={showDisabledAccount ? "hide" : "show"}
                                                  onClick={() => setShowDisabledAccount(!showDisabledAccount)}>
                                                  {showDisabledAccount ? "Hide" : "Show"} disabled accounts
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
                                          style={{ padding: "0.25em 2.5em" }}
                                          clearable
                                      />
                                      {console.log("list", { chains })}
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
                                                              <Controls.Button
                                                                  scale={1.125}
                                                                  style={{ padding: "0.5em 1em" }}
                                                                  onClick={() => router.push("/test")}>
                                                                  Test
                                                              </Controls.Button>
                                                              <Controls.Button
                                                                  scale={1.125}
                                                                  style={{ padding: "0.5em 1em" }}
                                                                  onClick={() => setSetting("apps")}>
                                                                  Connected Apps
                                                              </Controls.Button>
                                                              <Controls.Button
                                                                  scale={1.125}
                                                                  style={{ padding: "0.5em 1em" }}
                                                                  onClick={() => router.push("/change")}>
                                                                  Change Passcode
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
                      ],
                  },
                  // upper: {
                  //     active: mobileMenu === "notify",
                  //     children: [
                  //         {
                  //             active: mobileMenu === "notify",
                  //             children: <Sidebars.Notification list={notis} count={count} />,
                  //         },
                  //     ],
                  // },
              }
            : undefined;

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
        side,
        sidebars,
        footer,
        toastlist,
    };
}
