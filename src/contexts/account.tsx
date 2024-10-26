import { useStorage, useWallet } from "hooks";
import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from "react";

export interface AccountInfo {
    name: string;
    address: string;
    index: number;
    tokens?: {
        fts?: string[];
        nfts?: string[];
    };
}

interface AccountContextProps {
    account: AccountInfo | undefined;
    setAccount: (account?: AccountInfo | ((prevState?: AccountInfo | undefined) => AccountInfo | undefined)) => void;
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

    const [account, changeAccount] = useState<AccountInfo>();

    const setAccount = useCallback((account?: AccountInfo | ((prevState?: AccountInfo | undefined) => AccountInfo | undefined)) => {
        return changeAccount((state?: AccountInfo) => {
            account = (typeof account === "function" ? account(state) : account) as AccountInfo;
            const key = session?.get("key");
            const wallets = storage?.get(`${key}:wallets`);
            if (wallets) provider?.changeAccount(wallets[account.index]);
            return account;
        });
    }, []);

    return <AccountContext.Provider value={{ account, setAccount }}>{children}</AccountContext.Provider>;
};
