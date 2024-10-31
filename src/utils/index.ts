import CryptoJS from "crypto-js";
import { Chain } from "types";

export function parseChainId(chain: number | string | Chain): number {
    if (!chain) return 0;
    return typeof chain === "string" ? (chain.startsWith("0x") ? Number(chain) : parseInt(chain)) : typeof chain === "number" ? chain : parseChainId(chain?.id);
}

export function formatChainId(chain: number | string | Chain): string {
    if (!chain) return chain as any;
    return typeof chain === "string"
        ? chain.startsWith("0x")
            ? chain
            : formatChainId(parseInt(chain))
        : typeof chain === "number"
            ? `0x${chain?.toString(16)}`
            : formatChainId(chain?.id);
}

export const isMobile = () => {
    const browser = () => ((global || window) as any)?.navigator?.userAgent || ((global || window) as any)?.navigator?.vendor; /*|| window?.opera*/
    return (
        /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|modele|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
            browser(),
        ) ||
        /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
            browser()?.substring(0, 4),
        )
    );
};

const encrypt = (data?: string, salt?: string): string | undefined => {
    if (!data || !salt) return data;
    return CryptoJS.AES.encrypt(data, CryptoJS.SHA256(salt), {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    }).toString();
};

const decrypt = (data?: string, salt?: string): string | undefined => {
    if (!data || !salt) return data;
    return CryptoJS.AES.decrypt(data, CryptoJS.SHA256(salt), {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    }).toString(CryptoJS.enc.Utf8);
};

export const format = (value?: any): string | undefined => {
    if (typeof value === "undefined") return value;
    if (typeof value === "boolean" || typeof value === "number") return value.toString();
    return JSON.stringify(value);
};

export const parse = (value?: string): any => {
    if (typeof value === "undefined") return value;
    if (value === "true" || value === "false") return value === "true";
    else if (/^[0-9]*\.[0-9]+$/.test(value)) return parseFloat(value);
    else return JSON.parse(value);
};

export interface StorageController {
    get: (key: string) => any;
    gets: (keys: string[]) => Record<string, any>;
    getAll: () => Record<string, any>;
    set: (key: string, value: any) => void;
    sets: (map: string[][]) => void;
    remove: (key: string) => void;
    removes: (keys: string[]) => void;
    clear: () => void;
}

export const loadStorage = (prefix: string, storage?: CloudStorage | Storage, isTelegram?: boolean, salt?: string): StorageController => ({
    get: (key: string) => {
        return parse(decrypt(storage?.getItem(encrypt(`${prefix}:${key}`, salt)!) as string, salt));
    },
    gets: (keys: string[]) => {
        const values: Record<string, any> = {};
        if (isTelegram) {
            const items = storage?.getItems(keys?.map((k) => encrypt(`${prefix}:${k}`, salt))) as string[];
            items.forEach((v: string | undefined, i: number) => {
                if (v) values[keys[i]] = parse(decrypt(v, salt));
            });
        } else {
            keys.forEach((key) => {
                const value = storage?.getItem(encrypt(`${prefix}:${key}`, salt)!) as string;
                if (value) values[key] = parse(decrypt(value, salt));
            });
        }
        return values;
    },
    getAll: () => {
        const values: Record<string, any> = {};
        if (isTelegram) {
            const keys = storage?.getKeys() as any;
            const items = storage?.getItems(keys?.map((k: string) => decrypt(k, salt))) as any;
            items.forEach((v: string | undefined, i: number) => {
                if (v) values[keys[i].replace(`${prefix}:`, "")] = parse(decrypt(v, salt));
            });
        } else {
            if ((storage as Storage)?.length)
                for (let i = 0; i < (storage as Storage).length; i++) {
                    const key = (storage as Storage)?.key(i);
                    if (key && key.startsWith(`${prefix}:`)) {
                        const value = storage?.getItem(key) as string;
                        if (value) values[key.replace(`${prefix}:`, "")] = parse(decrypt(value, salt));
                    }
                }
        }
        return values;
    },
    set: (key: string, value: any) => {
        value = encrypt(format(value), salt);
        return value && storage?.setItem(encrypt(`${prefix}:${key}`, salt)!, value as string);
    },
    sets: (map: string[][]) => {
        return (
            map &&
            Array.isArray(map) &&
            Array?.isArray(map?.[0]) &&
            map?.map((item) => {
                if (item?.[0] && item?.[1]) {
                    const value = encrypt(format(item[1]), salt);
                    if (value) storage?.setItem(encrypt(`${prefix}:${item[0]}`, salt)!, value as any);
                }
            })
        );
    },
    remove: (key: string) => {
        return storage?.removeItem(encrypt(`${prefix}:${key}`, salt)!);
    },
    removes: (keys: string[]) => {
        if (isTelegram) {
            storage?.removeItems(keys?.map((k) => encrypt(`${prefix}:${k}`, salt)));
        } else {
            keys.forEach((key) => localStorage.removeItem(encrypt(`${prefix}:${key}`, salt)!));
        }
    },
    clear: () => {
        return isTelegram ? storage?.removeItems(storage?.getKeys()?.map((k: string) => encrypt(k, salt)) as any) : (storage as Storage)?.clear();
    },
});

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
});
