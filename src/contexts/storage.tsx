import { useTelegram } from "hooks";
import React, { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState } from "react";

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
    const [storage, setStorage] = useState<CloudStorage | Storage>();
    const [session, setSession] = useState<CloudStorage | Storage>();

    const prefix = "coinmeca:wallet";

    const format = (value?: any) => {
        if (typeof value === "undefined") return value;
        if (typeof value === "number") return value.toString();
        else return JSON.stringify(value);
    };

    const parse = (value?: string) => {
        if (typeof value === "undefined") return value;

        const isInteger = /^[0-9]+$/.test(value);
        const isFloat = /^[0-9]*\.[0-9]+$/.test(value);

        if (isInteger) return parseInt(value, 10);
        else if (isFloat) return parseFloat(value);
        else return JSON.parse(value);
    };

    const modules = useMemo(
        () => (storage?: CloudStorage | Storage) => ({
            get: (key: string) => {
                return parse(storage?.getItem(`${prefix}:${key}`) as any);
            },
            gets: (keys: string[]) => {
                const values: Record<string, any> = {};
                if (telegram && user?.id) {
                    const items = telegram?.CloudStorage.getItems(keys?.map((k) => `${prefix}:${k}`)) as any;
                    items.forEach((v: string | undefined, i: number) => {
                        if (v) values[keys[i]] = parse(v);
                    });
                } else {
                    keys.forEach((key) => {
                        const value = localStorage.getItem(`${prefix}:${key}`);
                        if (value) values[key] = parse(value);
                    });
                }
                return values;
            },
            getAll: () => {
                const values: Record<string, any> = {};
                if (telegram && user?.id) {
                    const keys = telegram?.CloudStorage.getKeys() as any;
                    const items = telegram?.CloudStorage.getItems(keys) as any;
                    items.forEach((v: string | undefined, i: number) => {
                        if (v) values[keys[i].replace(`${prefix}:`, "")] = parse(v);
                    });
                } else {
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key && key.startsWith(`${prefix}:`)) {
                            const value = localStorage.getItem(key);
                            if (value) values[key.replace(`${prefix}:`, "")] = parse(value);
                        }
                    }
                }
                return values;
            },
            set: (key: string, value: any) => {
                return value && storage?.setItem(`${prefix}:${key}`, format(value) as any);
            },
            sets: (map: string[][]) => {
                return (
                    map &&
                    Array.isArray(map) &&
                    Array?.isArray(map?.[0]) &&
                    map?.map((item) => item?.[0] && item?.[1] && storage?.setItem(`${prefix}:${item[0]}`, format(item[1]) as any))
                );
            },
            remove: (key: string) => {
                return storage?.removeItem(`${prefix}:${key}`);
            },
            removes: (keys: string[]) => {
                if (telegram && user?.id) {
                    telegram?.CloudStorage.removeItems(keys?.map((k) => `${prefix}:${k}`));
                } else {
                    keys.forEach((key) => localStorage.removeItem(`${prefix}:${key}`));
                }
            },
            clear: () => {
                return (telegram && user?.id) ? telegram?.CloudStorage.removeItems(telegram?.CloudStorage.getKeys() as any) : localStorage?.clear();
            },
        }),
        [telegram, user, storage],
    );

    useLayoutEffect(() => {
        setStorage((telegram && user?.id) ? telegram?.CloudStorage : localStorage);
        setSession(sessionStorage);
    }, []);

    return <StorageContext.Provider value={{ storage: modules(storage), session: modules(session) }}>{children}</StorageContext.Provider>;
};
