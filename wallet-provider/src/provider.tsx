"use client";

import React, { createContext, useContext, useLayoutEffect, useState } from "react";
import { Chain, Account, App } from "@coinmeca/wallet-sdk/types";
import { CoinmecaWalletProvider } from "@coinmeca/wallet-sdk/provider";

interface CoinmecaWalletProviderContextProps {
    provider: CoinmecaWalletProvider | undefined;
    account: Account | undefined;
    accounts: Account[] | undefined;
    chain: Chain | undefined;
    chains: Chain[] | undefined;
    apps: App[] | undefined;
    tokens: {
        fungibles?: string[];
        nonFungibles?: string[];
        multiTokens?: string[];
    };
}

const CoinmecaWalletContext = createContext<CoinmecaWalletProviderContextProps | undefined>(undefined);

export const useCoinmecaWalletProvider = () => {
    const context = useContext(CoinmecaWalletContext);
    if (!context) throw new Error("InjectedWalletContext for useInjectedWallet doesn't initialized yet.");
    return context;
};

export const CoinmecaWalletContextProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    const [provider, setProvider] = useState<CoinmecaWalletProvider>();

    const [account, setAccount] = useState<Account>();
    const [chain, setChain] = useState<Chain>();
    const [fungibles, setFungibles] = useState<any>();

    useLayoutEffect(() => {
        const chainId = (window as any)?.coinmeca?.request?.chainId;
        const provider = (window as any)?.coinmeca?.wallet || new CoinmecaWalletProvider({ chainId });
        setProvider(provider);
    }, []);

    useLayoutEffect(() => {
        if (provider) {
            const updateAccount = () => {
                setAccount(provider?.account());
            };

            const updateChain = () => {
                setChain(provider?.chain);
            };

            const updateApps = () => {};

            const updateFungibles = () => {
                setAccount(provider?.account());
            };

            const update = () => {
                updateAccount();
                updateChain();
            };

            provider?.on("unlock", update);
            provider?.on("accountChanged", updateAccount);
            provider?.on("chainChanged", updateChain);
            provider?.on("updateFungibleAsset", updateFungibles);
            return () => {
                provider?.off("unlock", update);
                provider?.off("accountChanged", updateAccount);
                provider?.off("chainChanged", updateChain);
                provider?.off("updateFungibleAsset", updateFungibles);
            };
        }
    }, [provider]);

    return (
        <CoinmecaWalletContext.Provider
            value={{
                provider,
                account,
                chain,
                accounts: provider?.accounts() as Account[],
                chains: provider?.chains,
                apps: provider?.apps,
                tokens: {
                    fungibles: chain?.chainId ? account?.tokens?.fungibles?.[`${chain?.chainId}`] : undefined,
                    nonFungibles: chain?.chainId ? account?.tokens?.nonFungibles?.[`${chain?.chainId}`] : undefined,
                    multiTokens: chain?.chainId ? account?.tokens?.multiTokens?.[`${chain?.chainId}`] : undefined,
                },
            }}>
            {children}
        </CoinmecaWalletContext.Provider>
    );
};
