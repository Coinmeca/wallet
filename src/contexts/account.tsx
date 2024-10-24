import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export interface AccountInfo {
    chain?: any;
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
    setAccount: React.Dispatch<React.SetStateAction<AccountInfo | undefined>>;
}

const AccountContext = createContext<AccountContextProps | undefined>(undefined);

export const useAccount = () => {
    const context = useContext(AccountContext);
    if (!context) throw new Error("AccountContext for useAccount doesn't initialized yet.");
    return context;
};

export const AccountProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [account, setAccount] = useState<AccountInfo>();
    return <AccountContext.Provider value={{ account, setAccount }}>{children}</AccountContext.Provider>;
};
