"use client";

import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { useMobile, useNotification, usePortal, useWindowSize } from "@coinmeca/ui/hooks";
import { Account, App } from "@coinmeca/wallet-sdk/types";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { useTelegram } from "@coinmeca/wallet-provider/telegram";
import { filter, format } from "@coinmeca/ui/lib/utils";
import { Root } from "@coinmeca/ui/lib/style";

import Coinmeca from "assets/coinmeca.svg";
import { Modals, Sidebars } from "containers";
import { PageLoader } from "hooks/usePageLoader";
import { useGuard, useMessageHandler, useTranslate } from "hooks";
import { MessageProps } from "contexts/message";
import { camelToTitleCase, chainLogo, debug, requestNameMap, requestRoute, site, valid } from "utils";

export default function Data({ isLoad, isRequest, isProxy, isMenu }: PageLoader) {
    const router = useRouter();
    const path = usePathname();
    const test = debug();

    const { windowSize } = useWindowSize();
    const { isAccess } = useGuard();
    const { isMobile } = useMobile();
    const { isInApp } = useTelegram();
    const { languageCode, setLanguageCode, t } = useTranslate();
    const { provider, account, accounts, chain, apps } = useCoinmecaWalletProvider();
    const { messages, count, current, setCurrent, failure, remove } = useMessageHandler();
    const { toasts, addToast } = useNotification();

    const [isClient, setIsClient] = useState(false);
    const [value, setValue] = useState<number>(0);
    const [tab, setTab] = useState<string>("icon");
    const [active, setActive] = useState(false);
    const [sideMenu, setSideMenu] = useState("");
    const [setting, setSetting] = useState("");

    const [appFilter, setAppFilter] = useState<string>();

    const isDesktop = isClient && windowSize.width > Root.Device.Desktop - 1;
    const responsive = isClient && windowSize.width <= Root.Device.Tablet;
    const activeAccount = account;
    const activeAddress = activeAccount?.address || provider?.address;
    const activeChain = chain;

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
            code: "fr",
            value: "Français",
        },
        {
            code: "es",
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
    const languageOption = languages.find((item) => item?.code === languageCode);

    useLayoutEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        const handleLock = () => setSideMenu("");
        provider?.on("lock", handleLock);
        return () => {
            provider?.off("lock", handleLock);
        };
    }, [provider]);

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
                    title: t("toast.wallet.address.copy"),
                    message: t("toast.wallet.address.copy.success", { name: account.name }),
                });
            })
            .catch(function (err) {
                addToast({
                    title: t("toast.wallet.address.copy"),
                    message: t("toast.wallet.address.copy.failure", { name: account.name }),
                });
            });
    };

    const [openApprovalManage, closeApprovalManage] = usePortal((props: any) => <Modals.App.Approval {...props} onClose={() => closeApprovalManage()} />);

    const handleApprovalManage = (app: App) => {
        !!app && openApprovalManage({ app });
    };

    const [openAppRevoke, closeAppRevoke] = usePortal((props: any) => <Modals.App.Revoke {...props} onClose={() => closeAppRevoke()} />);
    const handleRevokeApp = (app?: App) => {
        openAppRevoke({ app });
    };
    const navigateSetting = (href: string, closeMenu = false) => {
        if (closeMenu) {
            setSideMenu("");
            setSetting("");
        }
        router.push(href);
    };

    const applist = useCallback(
        (apps: Account[] = []) =>
            apps.map((app: App) => {
                const info = site(app?.url);
                const title = app?.name || info?.host || info?.origin || t("app.sidebar.app.unknown");

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
                                            children: [
                                                {
                                                    fit: true,
                                                    children: <Image width={32} height={32} src={app?.logo || ""} alt={title} />,
                                                },
                                                {
                                                    gap: 0,
                                                    children: [
                                                        <>
                                                            <Elements.Text size={1.5} height={1.5} title={title} fix>
                                                                {title}
                                                            </Elements.Text>
                                                        </>,
                                                        <>
                                                            <Elements.Text
                                                                size={1.375}
                                                                height={1.5}
                                                                weight={"light"}
                                                                opacity={0.6}
                                                                title={info?.origin || app?.url}
                                                                fix>
                                                                {info?.origin || app?.url}
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
                                                            { icon: "identity", value: t("app.sidebar.app.manage.approvals") },
                                                            { icon: "power", value: t("app.sidebar.app.revoke", { title }) },
                                                        ]}
                                                        onClickItem={(e: any, v: any, k: number) => {
                                                            switch (k) {
                                                                case 0:
                                                                    return handleApprovalManage(app);
                                                                case 1:
                                                                    return handleRevokeApp(app);
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
                };
            }),
        [isMobile, openApprovalManage, openAppRevoke, responsive, t],
    );
    const languageDropdown = (
        <Controls.Dropdown
            scale={Root.Device.Tablet >= windowSize.width ? 1.125 : undefined}
            option={languageOption}
            options={languages}
            style={{ options: { background: `rgba(var(--black-abs), var(--o075))` } }}
            onClickItem={(e: any, v: any) => setLanguageCode(v.code)}
            responsive={isMobile}
        />
    );
    const appSettingsContent = (
        <Layouts.Contents.InnerContent scroll={false}>
            <Layouts.Col gap={0} fill>
                <Controls.Input
                    placeholder={t("app.sidebar.app.search.placeholder")}
                    onChange={(e: any, v: string) => setAppFilter(v)}
                    left={{
                        children: <Elements.Icon icon={"search"} style={{ marginRight: "0.5em", padding: "0.333em 0" }} />,
                    }}
                    style={{ padding: "1.5em clamp(0em, 3.75%, 6em)" }}
                    clearable
                />
                <Layouts.List list={filter(apps, appFilter)} formatter={applist} />
            </Layouts.Col>
            <Layouts.Col gap={0} style={{ padding: "4em", paddingTop: "2em" }}>
                <Layouts.Row>
                    <Controls.Button type={"glass"} onClick={() => setSetting("")}>
                        {t("app.btn.back")}
                    </Controls.Button>
                </Layouts.Row>
            </Layouts.Col>
        </Layouts.Contents.InnerContent>
    );
    const settingsButtons = (responsiveSetting: boolean) => (
        <>
            {responsiveSetting && languageDropdown}
            {test && (
                <Controls.Button align={"left"} scale={1.125} style={{ padding: "0.5em 1em" }} onClick={() => navigateSetting("/test", responsiveSetting)}>
                    Test
                </Controls.Button>
            )}
            <Controls.Button
                align={"left"}
                iconLeft={responsiveSetting ? "blockchain" : undefined}
                scale={1.125}
                style={{ padding: "0.5em 1em" }}
                onClick={() => setSetting("apps")}>
                {t("app.setting.connected.apps")}
            </Controls.Button>
            <Controls.Button
                align={"left"}
                iconLeft={responsiveSetting ? "sheild-star" : undefined}
                scale={1.125}
                style={{ padding: "0.5em 1em" }}
                onClick={() => navigateSetting("/change", responsiveSetting)}>
                {t("app.setting.change.passcode")}
            </Controls.Button>
            <Controls.Button
                align={"left"}
                iconLeft={responsiveSetting ? "download" : undefined}
                scale={1.125}
                style={{ padding: "0.5em 1em" }}
                onClick={() => navigateSetting("/backup", responsiveSetting)}>
                {t("app.setting.backup.wallet")}
            </Controls.Button>
        </>
    );
    const settingsHome = (responsiveSetting: boolean) => (
        <Layouts.Col style={{ padding: "4em" }} reverse={responsiveSetting ? isInApp || isMobile : true} fill>
            <Layouts.Col gap={6} reverse={responsiveSetting ? !isInApp && !isMobile : false}>
                <Layouts.Col gap={6}>{settingsButtons(responsiveSetting)}</Layouts.Col>
                <Controls.Button
                    type={"line"}
                    iconLeft={responsiveSetting ? "lock" : undefined}
                    scale={1.125}
                    style={{ padding: "0.5em 1em" }}
                    onClick={() => provider?.lock()}>
                    {t("app.setting.lock")}
                </Controls.Button>
            </Layouts.Col>
        </Layouts.Col>
    );

    const [searchFilter, setSearchFilter] = useState<string>();
    const queuedRequestCount = useMemo(() => (current ? count : Math.max(0, messages.length - 1)), [count, current, messages.length]);
    const requestLabel = useCallback(
        (method?: string) => {
            const key = method ? requestNameMap?.[method as keyof typeof requestNameMap] : undefined;
            const translated = key ? t(key) : undefined;
            return (translated && translated !== key ? translated : camelToTitleCase(method) || method) || "";
        },
        [t],
    );
    const search = () => (
        <Controls.Input
            placeholder={sideMenu === "accounts" ? t("app.sidebar.account.search.placeholder") : t("app.sidebar.chain.search.placeholder")}
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
                active: (isDesktop && (sideMenu === "" || sideMenu === "accounts")) || sideMenu === "accounts",
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
        [search, searchFilter, responsive, isDesktop, isMobile, sideMenu],
    );

    const side = 56;
    const header = {
        color: colorMap,
        logo:
            isRequest ||
            (!responsive
                ? {
                      src: require("../assets/coinmeca.svg").default,
                      width: 128,
                      height: 48,
                      style: { marginLeft: provider?.isLocked ? 0 : undefined },
                  }
                : false) ||
            !isLoad ||
            !activeAccount,
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
            !isRequest && isLoad && activeAccount
                ? {
                      active: sideMenu === "menu",
                      onClick: () => (sideMenu === "menu" ? handlesideMenu("") : handlesideMenu("menu")),
                      children: [
                          {
                              name: t("app.menu.token"),
                              href: "/token",
                              active: path?.startsWith("/token"),
                              onClick: () => handlesideMenu(""),
                          },
                          {
                              name: t("app.menu.nft"),
                              href: "/nft",
                              active: path?.startsWith("/nft"),
                              onClick: () => handlesideMenu(""),
                          },
                          {
                              name: t("app.menu.activity"),
                              href: "/activity",
                              active: path?.startsWith("/activity"),
                              onClick: () => handlesideMenu(""),
                          },
                      ],
                  }
                : undefined,
        option:
            isLoad && !responsive && !provider?.isLocked
                ? {
                      children: languageDropdown,
                  }
                : undefined,
        side:
            isLoad && activeAccount && accounts?.length
                ? {
                      width: side - (responsive ? 8 : 5),
                      active: true,
                      style: !responsive ? { paddingRight: "1em" } : undefined,
                      children: isRequest ? (
                          <>
                              <Layouts.Row fit />
                              <Layouts.Row gap={0} align={"right"}>
                                  {queuedRequestCount > 0 && (
                                      <Controls.Tab
                                          active={sideMenu === "requests"}
                                          onClick={() => setSideMenu(sideMenu === "requests" ? "" : "requests")}
                                          show={"tablet"}
                                          toggle
                                          fit>
                                          <Elements.Icon scale={0.666} icon={"bell"} count={queuedRequestCount} />
                                      </Controls.Tab>
                                  )}
                              </Layouts.Row>
                          </>
                      ) : (
                          <>
                              <Layouts.Row fit>
                                  {activeAddress && activeAccount && (
                                      <Layouts.Row gap={0} fit>
                                          <Controls.Tab
                                              active={isDesktop || sideMenu === "accounts"}
                                              toggle={!isDesktop}
                                              onClick={() => !isDesktop && handlesideMenu(sideMenu === "accounts" ? "" : "accounts")}>
                                              {sideMenu === "accounts" ? (
                                                  <Layouts.Row gap={0.5} align={"middle"}>
                                                      <Elements.Icon icon={"x"} scale={0.666} />
                                                      <Elements.Text size={1}>{t("app.sidebar.account.close")}</Elements.Text>
                                                  </Layouts.Row>
                                              ) : (
                                                  <Elements.Avatar
                                                      scale={0.666}
                                                      size={2.5}
                                                      display={6}
                                                      ellipsis={" ... "}
                                                      character={`${activeAccount.index + 1}`}
                                                      name={activeAddress}
                                                  />
                                              )}
                                          </Controls.Tab>
                                          {sideMenu !== "accounts" && (
                                              <Controls.Button
                                                  icon={"copy"}
                                                  title={t("app.wallet.address.copy")}
                                                  onClick={() => handleCopyAddress(activeAccount)}
                                              />
                                          )}
                                      </Layouts.Row>
                                  )}
                              </Layouts.Row>
                              <Layouts.Row gap={0} align={"right"}>
                                  <Controls.Tab active={sideMenu === "chains"} onClick={() => handlesideMenu(sideMenu === "chains" ? "" : "chains")} toggle fit>
                                      {sideMenu === "chains" ? (
                                          <Elements.Icon icon={"x"} scale={0.666} />
                                      ) : (
                                          <Elements.Avatar scale={0.666} size={2.5} img={chainLogo(activeChain?.chainId, activeChain?.logo)} />
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
        panels:
            isAccess && isLoad
                ? isRequest
                    ? [
                          {
                              active: sideMenu === "requests",
                              children: (
                                  <Layouts.Contents.InnerContent>
                                      {queuedRequestCount > 0 ? (
                                          <Layouts.List
                                              list={messages}
                                              formatter={(messages: MessageProps[]) =>
                                                  messages?.length &&
                                                  messages?.map((m) => {
                                                      const info = site(m?.request?.app?.url);
                                                      const title = m?.request?.app?.name || info?.host || info?.origin;
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
                                                                              setCurrent(m?.id || "");
                                                                              router.push(requestRoute(m?.request?.method) || "/");
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
                                                                                                      {requestLabel(m?.request?.method)}
                                                                                                  </Elements.Text>
                                                                                              </>,
                                                                                          ],
                                                                                          [
                                                                                              [
                                                                                                  ...(title
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
                                                                                                                                        img={
                                                                                                                                            m?.request?.app
                                                                                                                                                ?.logo
                                                                                                                                        }
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
                                                                                                                            size={1}
                                                                                                                            type={"desc"}
                                                                                                                            weight={"bold"}
                                                                                                                            fix>
                                                                                                                            {title}
                                                                                                                        </Elements.Text>
                                                                                                                    </>,
                                                                                                                    ...(info?.origin
                                                                                                                        ? [
                                                                                                                              <>
                                                                                                                                  <Elements.Text
                                                                                                                                      size={1.25}
                                                                                                                                      weight={"normal"}
                                                                                                                                      opacity={0.6}
                                                                                                                                      fix>
                                                                                                                                      {info.origin}
                                                                                                                                  </Elements.Text>
                                                                                                                              </>,
                                                                                                                          ]
                                                                                                                        : []),
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
                                                                                                    if (count === 1) setSideMenu("");
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
                                              <Elements.Text type={"desc"}>{t("app.sidebar.request.none")}</Elements.Text>
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
                                                children: settingsHome(true),
                                            },
                                            {
                                                active: setting === "apps",
                                                children: appSettingsContent,
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
                                              children: settingsHome(false),
                                          },
                                          {
                                              active: setting === "apps",
                                              children: appSettingsContent,
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
                            <Controls.Button icon={"book"} title={t("app.footer.documents")} fit />
                        </>,
                        <>
                            <Controls.Button icon={"medium"} title={"Medium"} fit />
                        </>,
                    ],
                },
                [
                    <>
                        <Controls.Button type={"line"}>{t("app.footer.contact")}</Controls.Button>
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
