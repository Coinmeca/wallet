import React, { createContext, useCallback, useContext, useLayoutEffect, useState } from "react";
import { useTelegram } from "hooks";
import { loadStorage } from "utils";

interface StorageProps {
    get: (key: string) => any;
    gets: (key: string[]) => any;
    set: (key: string, value: any) => any;
    remove: (key: string) => any;
    clear: () => any;
}

interface StorageContextProps {
    storage: StorageProps | undefined;
    session: StorageProps | undefined;
}

const StorageContext = createContext<StorageContextProps | undefined>(undefined);

export const useStorage = () => {
    const context = useContext(StorageContext);
    if (!context) throw new Error("StorageContext for useStorage doesn't initialized yet.");
    return context;
};

export const StorageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { telegram, user } = useTelegram();
    const [storage, setStorage] = useState<CloudStorage | Storage | any>();
    const [session, setSession] = useState<CloudStorage | Storage | any>();

    const modules = useCallback(
        (storage?: CloudStorage | Storage | any) => loadStorage("coinmeca:wallet", storage, !!(telegram && user?.id), process.env.NEXT_PUBLIC_KEY),
        [telegram, user, storage],
    );

    useLayoutEffect(() => {
        setStorage(telegram && user?.id ? telegram?.CloudStorage : localStorage);
        setSession(sessionStorage);
    }, []);

    return <StorageContext.Provider value={{ storage: modules(storage), session: modules(session) }}>{children}</StorageContext.Provider>;
};
