import { isIosAndRedirectable, scopePollingDetectionStrategy, WalletConfig, WalletName, WalletReadyState } from "@coinmeca/wallet-core/core/adapter";
import { WalletAccountError, WalletAddressError, WalletConnectionError, WalletDisconnectionError, WalletError, WalletNotConnectedError, WalletNotReadyError, WalletSendTransactionError, WalletUserReject } from '@coinmeca/wallet-core/core/errors';
import { formatChainId, parseChainId } from '@coinmeca/wallet-core/utils';
import type { Provider, RequestArguments } from "@coinmeca/wallet-core/core/evm/module";
import type { Asset, Chain } from "@coinmeca/wallet-core/types";
import { Message } from "@coinmeca/wallet-core/core/svm/module";
import { Transaction } from "ethereumjs-tx";
import { getChainById } from "@coinmeca/wallet-core/chains";

export const CoinmecaWalletName = "CoinmecaWallet" as WalletName<"CoinmecaWallet">;

export interface CoinmecaWalletProvider extends Provider { }
export interface CoinmecaWalletAdapterConfig extends WalletConfig { }

export class CoinmecaWalletAdapter {
    name = CoinmecaWalletName;

    protected _config: CoinmecaWalletAdapterConfig | undefined;
    protected _state: WalletReadyState = WalletReadyState.NotDetected;
    protected _connecting: boolean = false;

    protected _provider: CoinmecaWalletProvider | null;
    protected _chain: Chain | null;
    protected _accounts: string[] | null;

    constructor(config?: CoinmecaWalletAdapterConfig) {
        this._provider = null;
        this._chain = null;
        this._accounts = null;

        if (config) this._config = { ...config, options: { ...config?.options, mustBeCoinmecaWallet: true } } as CoinmecaWalletAdapterConfig;
        if (isIosAndRedirectable()) {
            if (this.provider) {
                this._state = WalletReadyState.Loadable;
                this.provider?.emit("readyStateChange", this._state);
            } else {
                this._state = WalletReadyState.Unsupported;
            }
        } else {
            scopePollingDetectionStrategy(() => {
                if (this.provider) {
                    this._state = WalletReadyState.Installed;
                    this.provider?.emit("readyStateChange", this._state);
                    return true;
                } else return false;
            });
        }
    }


    get state() {
        return this._state;
    };

    get address() {
        return Array.isArray(this._accounts) ? this._accounts[0] : this._accounts || '';
    }

    get connecting() {
        return this._connecting;
    }

    get connected() {
        return !!this._accounts;
    }

    get provider() {
        if (!this._provider) {
            window.addEventListener("eip6963:announceProvider", (event: any) => {
                if (event?.detail?.info?.name === this.name) this._provider = event.detail.provider;
            });
            window.dispatchEvent(new Event("eip6963:requestProvider"));
        }
        return this._provider;
    }

    async getAddress(): Promise<string[] | undefined | null> {
        return (await this.provider?.request({ method: "eth_accounts" })) as string[] | undefined | null;
    }

    async chain(chain?: number | string | Chain): Promise<Chain | null> {
        const c = chain;
        if (c) {
            chain = getChainById(parseChainId(c)) as Chain;
            await this.provider
                ?.request({
                    method: "wallet_addEthereumChain",
                    params: [
                        {
                            chainId: formatChainId(chain?.id),
                            ...(chain?.name && { chainName: chain?.name }),
                            ...(chain?.rpc && { rpcUrls: chain?.rpc }),
                            ...(chain?.explorer && { blockExplorerUrls: chain?.explorer }),
                            ...(chain?.nativeCurrency && { nativeCurrency: chain?.nativeCurrency }),
                        },
                    ],
                })
                .then((success: any) => {
                    if (success) this._chainChanged(c);
                });
        } else {
            await this.provider?.request({ method: "eth_chainId" }).then((chainId: any) => this._chainChanged(chainId));
        }
        return this._chain as Chain;
    }

    async message(msg: string, fn?: Function): Promise<void> {
        this.provider?.on("message", (message: Message | any) => {
            if (typeof fn === "function") fn;
        });
    }

    async watchAsset({ type, address, symbol, decimals, image }: Asset): Promise<boolean> {
        if (!this.provider) throw new WalletConnectionError();
        return this.provider
            .request({
                method: "wallet_watchAsset",
                params: {
                    type: type,
                    options: {
                        address,
                        symbol,
                        decimals,
                        image,
                    },
                },
            })
            .then((success: any) => {
                if (!success) throw new WalletUserReject();
                return true;
            });
    }

    async _accountChanged() {
        await this.provider
            ?.request({ method: "eth_requestAccounts" })
            .then(async (accounts: any) => {
                if (!accounts || accounts?.length === 0) throw new WalletAccountError();
                this._accounts = accounts;

                this.provider!.on("chainChanged", this._chainChanged);
                this.provider!.on("accountsChanged", this._accountChanged);
                this.provider!.on("disconnect", this.disconnect);

                this.provider!.emit("connect", accounts[0]);
            })
            .catch(() => {
                throw new WalletAddressError();
            });
    }

    _chainChanged(chain: number | string | Chain): void | PromiseLike<void> {
        this._chain = getChainById(parseChainId(chain)) as Chain;
    }

    async sendTransaction(tx: Transaction | Transaction[], success?: Function | Promise<any>, failure?: Function | Promise<any>): Promise<void> {
        tx = Array.isArray(tx) ? tx : [tx];

        await Promise.all(
            tx.map(
                async (params) =>
                    await this.provider
                        ?.request({
                            method: "eth_sendTransaction",
                            params,
                        })
                        .then(async (txHash: any) => {
                            if (txHash) {
                                if (typeof success === "function") await success(txHash);
                            }
                        })
                        .catch(async (error: any) => {
                            if (error) {
                                if (typeof failure === "function") await failure(error);
                            }
                        })
            )
        )
            .then(async (response: any) => {
                if (typeof success === "function") await success(response);
            })
            .catch(async (error: any) => {
                if (typeof failure === "function") await failure(error);
            });
    }

    async request(requests: RequestArguments | RequestArguments[], success?: Function | Promise<any>, failure?: Function | Promise<any>) {
        requests = Array.isArray(requests) ? requests : [requests];
        return Promise.all(
            requests.map(
                async (r, id) =>
                    await this.provider
                        ?.request(r)
                        .then(async (result: any) => {
                            result = {
                                jsonrpc: "2.0",
                                id,
                                result,
                            };
                            if (typeof r?.success === "function") await r?.success(result);
                            return result;
                        })
                        .catch(async (error: any) => {
                            if (typeof r?.failure === "function") await r?.failure(error);
                            throw new WalletSendTransactionError(error);
                        })
            )
        )
            .then(async (result: any) => typeof success === "function" && (await success(result)))
            .catch(async (error: any) => {
                typeof failure === "function" && (await failure(error));
                throw new WalletSendTransactionError(error);
            });
    }

    async signature(requests: any[]): Promise<string | string[] | unknown | undefined> {
        requests = Array.isArray(requests) ? requests : [requests];
        return await Promise.all(requests.map(async (params) => await this.provider?.request({ method: "eth_signTypedData_v4", params })));
    }

    async autoConnect(): Promise<void> {
        if (this._state === WalletReadyState.Installed) {
            await this.connect();
        }
    }

    async connect(chain?: number | string | Chain): Promise<void> {
        let account = undefined;
        try {
            // if (isMobile() && !window?.navigator.userAgent.includes(this.name)) window.location.href = `dapp://${window.location.host + window.location.pathname}`;
            if (!this.provider) throw new WalletNotReadyError();
            if (this.connected || this.connecting) return;

            this._connecting = true;
            try {
                await this.provider
                    ?.request({ method: "eth_requestAccounts" })
                    .then(async (accounts: any) => {
                        if (!accounts || accounts?.length === 0) throw new WalletAccountError();
                        this._accounts = accounts;

                        this.provider!.on("chainChanged", this._chainChanged);
                        this.provider!.on("accountsChanged", this._accountChanged);
                        this.provider!.on("disconnect", this.disconnect);

                        this.provider!.emit("connect", accounts[0]);
                    })
                    .catch((error: any) => {
                        throw new WalletAddressError(error?.message, error);
                    });

                if (chain) await this.chain(chain);
            } catch (error: any) {
                throw new WalletNotConnectedError(error?.message, error);
            }
        } catch (error: any) {
            this.provider?.emit("error", error);
        }
        this._connecting = false;
        return account;
    }

    async disconnect() {
        try {
            this.provider!.off("chainChanged", this._chainChanged);
            this.provider!.off("accountsChanged", this._accountChanged);
            this.provider!.off("disconnect", this.disconnect);
            this.provider!.emit("disconnect");

            this._provider = null;
            this._accounts = null;

            return true;
        } catch (e) {
            throw new WalletDisconnectionError(e?.toString());
        }
    }

    on(event: string, listener: (...args: any[]) => void) {
        this.provider?.on(event, listener);
    }

    off(event: string, listener: (...args: any[]) => void) {
        this.provider?.off(event, listener);
    }
}