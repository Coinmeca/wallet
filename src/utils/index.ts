
export const format = (value?: any) => {
    if (typeof value === "undefined") return value;
    if (typeof value === "boolean" || typeof value === "number") return value.toString();
    return JSON.stringify(value);
};

export const parse = (value?: string) => {
    if (typeof value === "undefined") return value;

    if (value === "true" || value === "false") return value === "true";
    else if (/^[0-9]*\.[0-9]+$/.test(value)) return parseFloat(value);
    else return JSON.parse(value);
};

export interface StorageController {
    get: (key: string) => any; // Adjust the return type as needed
    gets: (keys: string[]) => Record<string, any>;
    getAll: () => Record<string, any>;
    set: (key: string, value: any) => void;
    sets: (map: string[][]) => void;
    remove: (key: string) => void;
    removes: (keys: string[]) => void;
    clear: () => void;
}

export const loadStroage = (prefix: string, storage?: CloudStorage | Storage, isTelegram?: boolean): StorageController => ({
    get: (key: string) => {
        return parse(storage?.getItem(`${prefix}:${key}`) as any);
    },
    gets: (keys: string[]) => {
        const values: Record<string, any> = {};
        if (isTelegram) {
            const items = storage?.getItems(keys?.map((k) => `${prefix}:${k}`)) as any;
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
        if (isTelegram) {
            const keys = storage?.getKeys() as any;
            const items = storage?.getItems(keys) as any;
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
        if (isTelegram) {
            storage?.removeItems(keys?.map((k) => `${prefix}:${k}`));
        } else {
            keys.forEach((key) => localStorage.removeItem(`${prefix}:${key}`));
        }
    },
    clear: () => {
        return isTelegram ? storage?.removeItems(storage?.getKeys() as any) : localStorage?.clear();
    },
})

export interface TelegramController {
    telegram: Telegram["WebApp"] | undefined;
    user: Telegram["WebApp"]["initDataUnsafe"]["user"] | undefined;
    isInApp?: boolean;
    isExpanded?: boolean;
    isVerticalSwipe?: boolean;
    isCloseConfirm?: boolean;
    storage?: CloudStorage;
    send: (text: string) => void | undefined;
    enable: {
        vertical: () => void | undefined;
        closeConfirm: () => void | undefined;
    };
    disable: {
        vertical: () => void | undefined;
        closeConfirm: () => void | undefined;
    };
    bio: {
        request: (reason?: string) => BiometricManager | undefined;
        auth: (reason?: string) => BiometricManager | undefined;
    };
    show: {
        alert: (message: string, callback?: () => void) => void | undefined;
        confirm: (title: string, callback?: (ok: boolean) => void) => void | undefined;
        popup: (popup: PopupParams, callback?: ((button_id: string) => void) | undefined) => void | undefined;
        scanQR: (text: string, callback?: (data: string) => void) => void | undefined;
    };
    open: {
        internal: (url: string, callback?: Function) => void;
        external: (url: string, try_instant_view?: boolean, callback?: Function) => void;
    };
    expand: (callback?: Function) => void;
    exit: (callback?: Function) => void;
}

export const loadTelegram = (telegram?: Telegram["WebApp"]): TelegramController => ({
    telegram,
    user: telegram?.initDataUnsafe?.user,
    isInApp: telegram && telegram?.platform !== "unknown",
    isExpanded: telegram?.isExpanded || false,
    isVerticalSwipe: telegram?.isVerticalSwipesEnabled,
    isCloseConfirm: telegram?.isClosingConfirmationEnabled,

    storage: telegram?.CloudStorage,

    send: (text: string) => telegram && telegram?.sendData(text),

    enable: {
        vertical: () => telegram?.enableVerticalSwipes?.(),
        closeConfirm: () => telegram?.enableClosingConfirmation?.(),
    },

    disable: {
        vertical: () => telegram?.disableVerticalSwipes?.(),
        closeConfirm: () => telegram?.disableClosingConfirmation?.(),
    },

    bio: {
        request: (reason?: string) => telegram && telegram.BiometricManager.requestAccess({ reason }),
        auth: (reason?: string) => telegram && telegram.BiometricManager.authenticate({ reason }),
    },

    show: {
        alert: (message: string, callback?: () => void) => telegram && telegram?.showAlert(message, callback),
        confirm: (title: string, callback?: (ok: boolean) => void) => telegram && telegram?.showConfirm(title, callback),
        popup: (popup: PopupParams, callback?: ((button_id: string) => void) | undefined) => telegram && telegram?.showPopup(popup, callback),
        scanQR: (text: string, callback?: (data: string) => void) => telegram && telegram?.showScanQrPopup({ text }, callback),
    },

    open: {
        internal: (url: string, callback?: Function) => {
            if (telegram) {
                telegram?.openTelegramLink(url);
                callback?.();
            }
        },
        external: (url: string, try_instant_view?: boolean, callback?: Function) => {
            if (telegram) {
                telegram?.openLink(url, { try_instant_view });
                callback?.();
            }
        },
    },

    expand: (callback?: Function) => {
        if (telegram) {
            telegram?.expand();
            callback?.();
        }
    },

    exit: (callback?: Function) => {
        if (telegram) {
            telegram?.close();
            telegram?.MainButton?.offClick(() => {
                callback?.();
            });
        }
    },
})