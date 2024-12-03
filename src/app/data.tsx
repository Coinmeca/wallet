"use client";

import Image from "next/image";
import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { useMobile, useNotification, usePortal, useWindowSize } from "@coinmeca/ui/hooks";
import { Account, App } from "@coinmeca/wallet-sdk/types";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { filter, format } from "@coinmeca/ui/lib/utils";
import { Root } from "@coinmeca/ui/lib/style";

import Coinmeca from "assets/coinmeca.svg";
import { Modals, Sidebars } from "containers";
import { PageLoader } from "hooks/usePageLoader";
import { useMessageHandler, useTelegram } from "hooks";
import { MessageProps } from "contexts/message";
import { requestNameMap } from "utils";

export default function Data({ isLoad, isRequest, isProxy, isMenu }: PageLoader) {
    const router = useRouter();
    const path = usePathname();

    const { windowSize } = useWindowSize();
    const { isMobile } = useMobile();
    const { isInApp } = useTelegram();
    const { provider, account, chain, apps } = useCoinmecaWalletProvider();
    const { messages, count, current, failure, remove } = useMessageHandler();
    const { toasts, addToast } = useNotification();

    const [isClient, setIsClient] = useState(false);
    const [value, setValue] = useState<number>(0);
    const [tab, setTab] = useState<string>("icon");
    const [active, setActive] = useState(false);
    const [sideMenu, setSideMenu] = useState("");
    const [setting, setSetting] = useState("");

    const [appFilter, setAppFilter] = useState<string>();

    const desktop = isClient && windowSize.width > Root.Device.Desktop - 1;
    const responsive = isClient && windowSize.width <= Root.Device.Tablet;

    const colorMap = responsive
        ? "var(--rainbow)"
        : provider?.isLocked || path?.startsWith("/request")
        ? "red"
        : path?.startsWith("/token")
        ? "green"
        : path?.startsWith("/nft")
        ? "blue"
        : path?.startsWith("/activity")
        ? "orange"
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

    useLayoutEffect(() => {
        setIsClient(true);
    }, []);

    const handlesideMenu = (menu: string) => {
        setSideMenu(menu);
        if (responsive) {
            setSearchFilter("");
            setSetting("");
        }
    };

    const handleCopyAddress = async (account: Account) => {
        await navigator.clipboard
            .writeText(account.address)
            .then(function () {
                addToast({
                    title: `Copy address`,
                    message: `The address of ${account.name} copied.`,
                });
            })
            .catch(function (err) {
                addToast({
                    title: `Copy address`,
                    message: `Failed to copy the address of ${account.name}.`,
                });
            });
    };

    const [openApprovalManage, closeApprovalManage] = usePortal((props: any) => <Modals.App.Approval {...props} onClose={() => closeApprovalManage()} />);

    const handleApprovalManage = (app: App) => {
        !!app && openApprovalManage({ app });
    };

    const [openAppRevoke, closeAppRevoke] = usePortal((props: any) => <Modals.App.Revoke {...props} onClose={() => closeAppRevoke()} />);
    const handleRevokeApp = (url?: string) => {
        openAppRevoke({ url });
    };

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
                                        children: [
                                            {
                                                fit: true,
                                                children: <Image width={32} height={32} src={app?.logo || ""} alt={app?.name || ""} />,
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
                                                    responsive={isMobile && responsive}
                                                    chevron={false}
                                                    fix
                                                    fit
                                                />
                                            </>,
                                        ],
                                    },
                                ],
                            },
                        ],
                    ],
                ],
            })),
        [apps, responsive],
    );

    const [searchFilter, setSearchFilter] = useState<string>();
    const search = () => (
        <Controls.Input
            placeholder={sideMenu === "accounts" ? "Search account by name or address..." : "Search chain by id or name..."}
            value={searchFilter}
            onChange={(e: any, v: string) => setSearchFilter(v)}
            left={{ children: <Elements.Icon icon={"search"} style={{ marginRight: "0.5em", padding: "0.333em 0" }} /> }}
            style={responsive ? { padding: "1.5em clamp(0em, 3.75%, 6em)" } : { padding: "0.25em 2.5em" }}
            clearable
        />
    );

    const sideContents = useMemo(
        () => [
            {
                active: (desktop && (sideMenu === "" || sideMenu === "accounts")) || sideMenu === "accounts",
                children: (
                    <Sidebars.Accounts
                        search={search()}
                        searchFilter={searchFilter}
                        responsive={responsive}
                        isMobile={isMobile}
                        onClose={() => setSideMenu("")}
                    />
                ),
            },
            {
                active: sideMenu === "chains",
                children: (
                    <Sidebars.Chains
                        search={search()}
                        searchFilter={searchFilter}
                        responsive={responsive}
                        isMobile={isMobile}
                        onClose={() => setSideMenu("")}
                    />
                ),
            },
        ],
        [search, searchFilter, responsive],
    );

    const side = 56;
    const header = {
        color: colorMap,
        logo:
            isRequest ||
            (windowSize?.width > Root.Device.Tablet
                ? {
                      src: require("../assets/coinmeca.svg").default,
                      width: 128,
                      height: 48,
                      style: { marginLeft: provider?.isLocked ? 0 : undefined },
                  }
                : false) ||
            !isLoad ||
            !account,
        style: {
            children: {
                children: {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    children: {
                        maxWidth: provider?.isLocked || isRequest ? 0 : "100%",
                        minWidth: "max-content",
                        transition: ".3s ease",
                    },
                },
            },
        },
        menu:
            !isRequest && isLoad && account
                ? {
                      active: sideMenu === "menu",
                      onClick: () => (sideMenu === "menu" ? handlesideMenu("") : handlesideMenu("menu")),
                      children: [
                          {
                              name: "Token",
                              href: "/token",
                              active: path?.startsWith("/token"),
                              onClick: () => handlesideMenu(""),
                          },
                          {
                              name: "NFT",
                              href: "/nft",
                              active: path?.startsWith("/nft"),
                              onClick: () => handlesideMenu(""),
                          },
                          {
                              name: "Activity",
                              href: "/activity",
                              active: path?.startsWith("/activity"),
                              onClick: () => handlesideMenu(""),
                          },
                      ],
                  }
                : undefined,
        side:
            isLoad && account
                ? {
                      width: side - (responsive ? 8 : 5),
                      active: true,
                      style: !responsive ? { paddingRight: "1em" } : undefined,
                      children: isRequest ? (
                          <>
                              <Layouts.Row fit />
                              <Layouts.Row gap={0} align={"right"}>
                                  {count > 1 && (
                                      <Controls.Tab
                                          active={sideMenu === "requests"}
                                          onClick={() => setSideMenu(sideMenu === "requests" ? "" : "requests")}
                                          show={"tablet"}
                                          toggle
                                          fit>
                                          <Elements.Icon scale={0.666} icon={"bell"} count={count - 1} />
                                      </Controls.Tab>
                                  )}
                              </Layouts.Row>
                          </>
                      ) : (
                          <>
                              <Layouts.Row fit>
                                  {account?.address && (
                                      <Layouts.Row gap={0} fit>
                                          <Controls.Tab
                                              active={desktop || sideMenu === "accounts"}
                                              toggle={!desktop}
                                              onClick={() => !desktop && handlesideMenu(sideMenu === "accounts" ? "" : "accounts")}>
                                              {sideMenu === "accounts" ? (
                                                  <Layouts.Row gap={0.5} align={"middle"}>
                                                      <Elements.Icon icon={"x"} scale={0.666} />
                                                      <Elements.Text size={1}>Close Account List</Elements.Text>
                                                  </Layouts.Row>
                                              ) : (
                                                  <Elements.Avatar
                                                      scale={0.666}
                                                      size={2.5}
                                                      display={6}
                                                      ellipsis={" ... "}
                                                      character={`${account?.index + 1}`}
                                                      name={account?.address}
                                                  />
                                              )}
                                          </Controls.Tab>
                                          {sideMenu !== "accounts" && (
                                              <Controls.Button icon={"copy"} title={"Copy address"} onClick={() => handleCopyAddress(account)} />
                                          )}
                                      </Layouts.Row>
                                  )}
                              </Layouts.Row>
                              <Layouts.Row gap={0} align={"right"}>
                                  <Controls.Tab active={sideMenu === "chains"} onClick={() => handlesideMenu(sideMenu === "chains" ? "" : "chains")} toggle fit>
                                      {sideMenu === "chains" ? (
                                          <Elements.Icon icon={"x"} scale={0.666} />
                                      ) : (
                                          <Elements.Avatar
                                              scale={0.666}
                                              size={2.5}
                                              img={chain?.logo || `https://web3.coinmeca.net/${chain?.chainId}/logo.svg`}
                                          />
                                      )}
                                  </Controls.Tab>
                                  <Controls.Tab
                                      active={sideMenu === "setting"}
                                      onClick={() => handlesideMenu(sideMenu === "setting" ? "" : "setting")}
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
        panels: isLoad
            ? isRequest
                ? [
                      {
                          active: sideMenu === "requests",
                          children: (
                              <Layouts.Contents.InnerContent>
                                  {count > 1 ? (
                                      <Layouts.List
                                          list={messages}
                                          formatter={(messages: MessageProps[]) =>
                                              messages?.length &&
                                              messages?.map((m) => {
                                                  const date = (format(m?.time, "date") as string).split(" ");
                                                  return {
                                                      onClick: current !== m?.id && (() => {}),
                                                      style: {
                                                          padding: responsive ? "2.5em clamp(2em, 5%, 8em)" : "2em 3em",
                                                          ...(current === m?.id && { background: "transparent", pointerEvents: "none" }),
                                                      },
                                                      motion: {
                                                          initial: { scale: 1, opacity: 0 },
                                                          aniamte: { scale: 1, opacity: 1, transition: { staggerChildren: 0.1 } },
                                                          exit: { scale: 0.9, opacity: 0, transition: { staggerChildren: 0.1 } },
                                                      },
                                                      children: [
                                                          [
                                                              [
                                                                  {
                                                                      style: { overflow: "hidden", ...(current === m?.id ? { opacity: 0.3 } : {}) },
                                                                      onClick: () => {
                                                                          router.push(`/request/${m?.request?.method}`);
                                                                          setSideMenu("");
                                                                      },
                                                                      children: [
                                                                          [
                                                                              {
                                                                                  gap: 0.5,
                                                                                  children: [
                                                                                      [
                                                                                          <>
                                                                                              <Elements.Text fix>
                                                                                                  {requestNameMap?.[
                                                                                                      m?.request?.method as keyof typeof requestNameMap
                                                                                                  ] || m?.request?.method}
                                                                                              </Elements.Text>
                                                                                          </>,
                                                                                      ],
                                                                                      [
                                                                                          [
                                                                                              ...(m?.request?.app?.name && m?.request?.app?.name !== ""
                                                                                                  ? [
                                                                                                        {
                                                                                                            gap: 0.5,
                                                                                                            children: [
                                                                                                                {
                                                                                                                    fit: true,
                                                                                                                    children: (
                                                                                                                        <>
                                                                                                                            {m?.request?.app?.logo && (
                                                                                                                                <Elements.Avatar
                                                                                                                                    size={2}
                                                                                                                                    img={m?.request?.app?.logo}
                                                                                                                                    style={{
                                                                                                                                        width: "max-content",
                                                                                                                                    }}
                                                                                                                                />
                                                                                                                            )}
                                                                                                                        </>
                                                                                                                    ),
                                                                                                                },
                                                                                                                <>
                                                                                                                    <Elements.Text
                                                                                                                        type={"desc"}
                                                                                                                        weight={"bold"}
                                                                                                                        fix>
                                                                                                                        {m?.request?.app?.name}
                                                                                                                    </Elements.Text>
                                                                                                                </>,
                                                                                                            ],
                                                                                                        },
                                                                                                    ]
                                                                                                  : []),
                                                                                          ],
                                                                                      ],
                                                                                  ],
                                                                              },
                                                                              //   {
                                                                              //       fit: true,
                                                                              //       children: [
                                                                              //           [
                                                                              //               {
                                                                              //                   gap: 0,
                                                                              //                   fit: true,
                                                                              //                   align: "right",
                                                                              //                   children: [
                                                                              //                       <>
                                                                              //                           <Elements.Text
                                                                              //                               type={"desc"}
                                                                              //                               align={"right"}
                                                                              //                               height={0}
                                                                              //                               fit>
                                                                              //                               {date[0]}
                                                                              //                           </Elements.Text>
                                                                              //                       </>,
                                                                              //                       <>
                                                                              //                           <Elements.Text
                                                                              //                               type={"desc"}
                                                                              //                               align={"right"}
                                                                              //                               height={0}
                                                                              //                               fit>
                                                                              //                               {date[1]}
                                                                              //                           </Elements.Text>
                                                                              //                       </>,
                                                                              //                   ],
                                                                              //               },
                                                                              //           ],
                                                                              //       ],
                                                                              //   },
                                                                          ],
                                                                      ],
                                                                  },
                                                                  ...(current !== m?.id
                                                                      ? [
                                                                            {
                                                                                fit: true,
                                                                                style: { pointerEvents: "initial", maxWitdth: "max-content" },
                                                                                children: [
                                                                                    <>
                                                                                        <Controls.Button
                                                                                            icon={"x"}
                                                                                            onClick={() => {
                                                                                                failure(m?.id, "User rejected this request.");
                                                                                                remove(m?.id);
                                                                                                if (count === 2) setSideMenu("");
                                                                                            }}
                                                                                        />
                                                                                    </>,
                                                                                ],
                                                                            },
                                                                        ]
                                                                      : []),
                                                              ],
                                                          ],
                                                      ],
                                                  };
                                              })
                                          }
                                      />
                                  ) : (
                                      <Layouts.Col align={"center"} fill>
                                          <Elements.Text type={"desc"}>There is no more requests.</Elements.Text>
                                      </Layouts.Col>
                                  )}
                              </Layouts.Contents.InnerContent>
                          ),
                      },
                  ]
                : responsive
                ? [
                      ...sideContents,
                      {
                          active: sideMenu === "setting",
                          children: (
                              <Layouts.Contents.SlideContainer
                                  contents={[
                                      {
                                          active: setting === "",
                                          children: (
                                              <Layouts.Col style={{ padding: "4em" }} reverse={isInApp || isMobile} fill>
                                                  <Layouts.Col gap={6} reverse={!isInApp && !isMobile}>
                                                      <Layouts.Col gap={6}>
                                                          <Controls.Button
                                                              align={"left"}
                                                              scale={1.125}
                                                              style={{ padding: "0.5em 1em" }}
                                                              onClick={() => {
                                                                  setSideMenu("");
                                                                  router.push("/test");
                                                              }}>
                                                              Test
                                                          </Controls.Button>
                                                          <Controls.Button
                                                              align={"left"}
                                                              iconLeft={"blockchain"}
                                                              scale={1.125}
                                                              style={{ padding: "0.5em 1em" }}
                                                              onClick={() => setSetting("apps")}>
                                                              Connected Apps
                                                          </Controls.Button>
                                                          <Controls.Button
                                                              align={"left"}
                                                              iconLeft={"sheild-star"}
                                                              scale={1.125}
                                                              style={{ padding: "0.5em 1em" }}
                                                              onClick={() => {
                                                                  setSideMenu("");
                                                                  router.push("/change");
                                                              }}>
                                                              Change Passcode
                                                          </Controls.Button>
                                                      </Layouts.Col>
                                                      <Controls.Button
                                                          type={"line"}
                                                          iconLeft={"lock"}
                                                          scale={1.125}
                                                          style={{ padding: "0.5em 1em" }}
                                                          onClick={() => {
                                                              setSideMenu("");
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
                : undefined
            : undefined,
    };

    const sidebars =
        !responsive && !isRequest && isLoad && !provider?.isLocked
            ? {
                  active: true,
                  lower: {
                      width: 48,
                      active: !!sideMenu && sideMenu !== "",
                      onBlur: (e: any) => {
                          console.log("e", e);
                          if (!e.currentTarget.contains(e.relatedTarget)) {
                              // setSidebar(false);
                          }
                      },
                      swipe: {
                          style: { marginTop: "5em" },
                          //   onActive: (e: any, active: boolean) => setSidebar(active),
                      },
                      children: [
                          ...sideContents,
                          {
                              active: sideMenu === "setting",
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
                                                                  align={"left"}
                                                                  scale={1.125}
                                                                  style={{ padding: "0.5em 1em" }}
                                                                  onClick={() => router.push("/test")}>
                                                                  Test
                                                              </Controls.Button>
                                                              <Controls.Button
                                                                  align={"left"}
                                                                  scale={1.125}
                                                                  style={{ padding: "0.5em 1em" }}
                                                                  onClick={() => setSetting("apps")}>
                                                                  Connected Apps
                                                              </Controls.Button>
                                                              <Controls.Button
                                                                  scale={1.125}
                                                                  align={"left"}
                                                                  style={{ padding: "0.5em 1em" }}
                                                                  onClick={() => router.push("/change")}>
                                                                  Change Passcode
                                                              </Controls.Button>
                                                          </Layouts.Col>
                                                          <Controls.Button
                                                              align={"left"}
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
                  //     active: sideMenu === "notify",
                  //     children: [
                  //         {
                  //             active: sideMenu === "notify",
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
        active: toasts && toasts?.length > 0 && sideMenu !== "notify",
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
