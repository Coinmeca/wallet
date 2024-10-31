import { getChainById } from "chains";
import { useStorage, useWallet } from "hooks";
import React, { createContext, useContext, useLayoutEffect, useState } from "react";
import { Account, Chain } from "types";
import { wallet } from "wallet";

interface AccountContextProps {
    account: Account | undefined;
    setAccount: (newAccount: Account) => void;
    resetAccount: () => void;
    chain: Chain | undefined;
    setChain: (chainId?: string | number | Chain) => void;
}

const AccountContext = createContext<AccountContextProps | undefined>(undefined);

export const useAccount = () => {
    const context = useContext(AccountContext);
    if (!context) throw new Error("AccountContext for useAccount doesn't initialized yet.");
    return context;
};

export const AccountProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { storage, session } = useStorage();
    const { provider } = useWallet();

    const [account, setAccount] = useState<Account>();
    const [chain, setChain] = useState<Chain>();

    const updateChain = (chain?: string | number | Chain) => {
        if (typeof chain === "undefined") return;
        if (typeof chain === "string" || typeof chain === "number") chain = getChainById(chain);
        if (chain) {
            setChain((state) => {
                const { id: chainId, name: chainName, rpc: rpcUrls, explorer: blockExplorerUrls, nativeCurrency } = chain as Chain;
                if (!state || (state && state.id !== chainId)) {
                    storage?.set("last:chainId", chainId);
                    provider?.changeChain({
                        chainId,
                        chainName,
                        nativeCurrency,
                        rpcUrls,
                        blockExplorerUrls,
                    });
                    return chain;
                } else return state;
            });
        }
    };

    const updateAccount = (info: number | string | Account) => {
        const key = session?.get("key");
        const wallets = storage?.get(`${key}:wallets`);

        if (typeof info === "number") info = storage?.get(wallet(wallets?.[info] || "").address) as Account;
        else if (typeof info === "string") info = storage?.get(info) as Account;
        if (!info) return;
        if (info?.address?.toLowerCase() !== account?.address?.toLowerCase()) {
            provider?.changeAccount(wallets[info.index]);
            storage?.set((info as Account).address, info);
            storage?.set("last:wallet", info.index);
            setAccount(info);
        }
    };

    const resetAccount = () => setAccount(undefined);

    useLayoutEffect(() => {
        const last = {
            chainId: storage?.get("last:chainId"),
            wallet: storage?.get("last:wallet"),
        };
        updateChain(provider?.chainId || last.chainId || 1);
        updateAccount(last.wallet);
    }, []);

    return <AccountContext.Provider value={{ account, setAccount: updateAccount, resetAccount, chain, setChain: updateChain }}>{children}</AccountContext.Provider>;
};
