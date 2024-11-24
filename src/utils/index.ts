import CryptoJS from "crypto-js";
import { Chain } from "@coinmeca/wallet-sdk/types";
import { Address, toBytes } from "viem";

export const isVideo = (url: string) => {
    const videoExtensions = ['.mp4', '.webm', '.avi', '.mov', '.mkv'];
    return videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
};

export const short = (value?: string, options?: { length?: number; ellipsis?: string; front?: boolean; back?: boolean }) => {
    if (!value) return;
    const length = options?.length || 6;
    const ellipsis = options?.ellipsis || " ... ";
    const front = options?.front;
    const back = options?.back;
    return (
        (front || !back ? value?.substring(0, value?.startsWith("0x") ? length + 2 : length) : "") +
        (front || back ? "" : ellipsis) +
        (!front || back ? value?.substring(value?.length - length, value?.length) : "")
    );
};

export const pattern = {
    chainId: /^[0-9]+$/,
    address: /^[a-zA-Z0-9]+$/,
};

export const enable = (...checks: boolean[]): boolean => checks.every(Boolean);

export const valid = {
    chainId: (...chainId: (number | string | undefined)[]) => {
        if (!chainId || chainId === undefined || chainId === null) return false;
        if (typeof chainId === "string" || typeof chainId === "number") chainId = [chainId];
        return enable(
            ...chainId?.map((c?: number | string) => {
                if (!c || c === undefined || c === null) return false;
                if (typeof c !== "string" && typeof c !== "number") return false;
                if (c === "" || c === "-" || c === "undefined" || c === "null" || c === "NaN") return false;
                if (!pattern.chainId.test(c?.toString())) return false;
                if (isNaN(parseInt(c?.toString()))) return false;
                return true;
            }),
        );
    },
    address: (...address: (Address | string | undefined)[]) => {
        if (!address || address === undefined || address === null) return false;
        if (typeof address === "string") address = [address];
        return enable(
            ...address?.map((a?: string) => {
                if (!a || a === undefined || a === null) return false;
                if (typeof a !== "string") return false;
                if (a === "" || a === "-" || a === "undefined" || a === "null" || a === "NaN") return false;
                if (!a?.startsWith("0x")) return false;
                if (!pattern.address.test(a)) return false;
                if (a?.length < 42) return false;
                if (a?.length > 42) return false;
                return true;
            }),
        );
    },
};

export const hex = {
    toBytes: (value: string) => {
        const bytes: number[] = [];
        value = value.replace(/[^0-9A-Fa-f]/g, '');
        for (let i = 0; i < value.length; i += 2) {
            const byte = parseInt(value.substring(i, 2), 16);
            if (!isNaN(byte)) bytes.push(byte);
        }
        return bytes;
    },
    toString: (value: string) => {
        if (!value || !value.length) return value;
        let data = value?.slice(64);
        if (data.length % 2 !== 0) data = '0' + data;
        return (Buffer.from(data, 'hex')).toString('utf8');
    },
    toNumber: (value: string) => Number(value),
}

export const bigInt = {
    toHex: (value: BigInt): string => {
        return "0x" + value.toString(16);
    },
}

export const base64 = {
    toJson: (value: string): any => {
        try {
            value = value?.split(',')?.[1]?.replace(/[^A-Za-z0-9+/=]/g, '');
            return JSON.parse(
                new TextDecoder().decode(
                    Uint8Array.from(
                        atob(value?.padEnd(value?.length + (4 - value?.length % 4) % 4, '=')),
                        (char) => char.charCodeAt(0)
                    )
                )
            );
        } catch (e) {
            console.log(e);
        }
    }
}

export const sanitizeBigIntToHex = (obj: any): any => {
    if (typeof obj === "bigint") {
        return bigInt.toHex(obj);
    } else if (Array.isArray(obj)) {
        return obj.map(sanitizeBigIntToHex);
    } else if (typeof obj === "object" && obj !== null) {
        return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, sanitizeBigIntToHex(value)]));
    }
    return obj;
};

export const objectToUrlParams = (obj: { [x: string | number | symbol]: any }) => {
    const params = new URLSearchParams();
    for (const key in obj) {
        const value = obj[key];

        if (Array.isArray(value)) value.forEach((v) => params.append(`${key}[]`, encodeURIComponent(v)));
        else if (typeof value === "object" && value !== null) {
            for (const nestedKey in value) {
                params.append(`${key}[${nestedKey}]`, encodeURIComponent(value[nestedKey]));
            }
        } else params.append(key, encodeURIComponent(value));
    }

    return params.toString();
};

export const getFaviconUrl = () => {
    const links = document.querySelectorAll("link[rel~='icon']") as NodeListOf<HTMLLinkElement>;
    if (links?.length > 0) return links[0].href;
    return `${window.location.origin}/favicon.ico`;
};

export const getFaviconUri = async () => {
    const links = document.querySelectorAll("link[rel~='icon']") as NodeListOf<HTMLLinkElement>;
    const faviconUrl = links?.length > 0 ? links[0].href : `${window.location.origin}/favicon.ico`;

    try {
        // Fetch the favicon as a Blob
        const response = await fetch(faviconUrl);
        const blob = await response.blob();

        // Convert the Blob to a data URI
        return await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("Error fetching favicon:", error);
        return null;
    }
};

export const openWindow = (target: string, args?: { width?: number; height?: number; method?: string; params?: any }) => {
    if (typeof window === "undefined") return;
    const width = args?.width || 360;
    const height = args?.height || 640;
    const origin = {
        width: window.innerWidth,
        height: window.innerHeight,
        left: window.screenX,
        top: window.screenY,
    };

    const left = origin.left + (origin.width - width) / 2;
    const top = origin.top + (origin.height - height) / 2;

    const popupId = `popup_${Date.now()}`;
    const url = new URL(target, window.location.origin);
    // url.searchParams.append("popupId", popupId);
    const newWindow: any = window.open(
        url.toString(),
        "_blank",
        `left=${left},top=${top},width=${width},height=${height},toolbar=no,location=no,menubar=no,status=no,resizable=no,scrollbars=no`,
    );

    if (newWindow)
        newWindow.addEventListener("load", () => {
            newWindow.coinmeca = {
                isPopup: true,
                popupId,
                method: args?.method,
                params: args?.params,
            };
        });

    return newWindow;
};

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

export const encrypt = (data?: string, salt?: string): string | undefined => {
    if (!data || !salt) return data;
    return CryptoJS.AES.encrypt(data, CryptoJS.SHA256(salt), {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7,
    }).toString();
};

export const decrypt = (data?: string | null, salt?: string): string | undefined => {
    if (!data) return undefined;
    else if (!salt) return data;
    return CryptoJS.AES.decrypt(data, CryptoJS.SHA256(salt), {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7,
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
                    const key = decrypt((storage as Storage)?.key(i), salt);
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

export const favicon = () => {
    return "data:image/x-icon;base64,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//7////+9fX1/jAwMP4AAAD+AAAA/gAAAP4AAAD+HBwc/gcHB/4AAAD+AAAA/gAAAP4AAAD+AAAA/gAAAP4AAAD+AAAA/gAAAP4AAAD+AQt6/w2P+7L4YQ5smg0C/wMAAP8AAAD+AAAA/gAAAP4AAAD+AAAA/ltbW/7////+/////v7+/v7////+9fX1/nd3d/4yMjL+MjIy/np6ev7+/v7+srKy/gAAAP4AAAD+AAAA/gAAAP4AAAD+AAAA/gAAAP4AAAD+AAAA/gAABP8CJ6b/Dr3/bP9uHCXHGAf/HQAA/wAAAP4AAAD+AAAA/gAAAP4AAAD+AQEB/sLCwv7////+/////v7+/v7////+/////v////7////+/////v////7////+rKys/gwMDP4AAAD+AAAA/gAAAP4AAAD+AAAA/gAAAP4AAAD+AAAi/wNb1f8O//8l////AeIiFvRWAAH/AAAA/gAAAP4AAAD+AAAA/gAAAP4AAAD+HBwc/uTk5P7////+/////v////7////+/////v////7////+/v7+/v////7////+ioqK/gAAAP4AAAD+AAAA/gAAAP4AAAD+AAAA/gAAAP4ABWD/BZvv9AD//wEAAAAA/yo3ZrIFDv8JAAD+AAAA/gAAAP4AAAD+AAAA/gAAAP4AAAD+HBwc/sPDw/7////+/////v////7////+/////v////7////+/////sTExP4qKir+AAAA/gAAAP4AAAD+AAAA/gAAAP4AAAD+AAAM/gFJwP8I5v9mAAAAAAAAAAD/SZIH7Q83/1MABv8AAAD+AAAA/gAAAP4AAAD+AAAA/gAAAP4AAAD+AAAA/lxcXP7BwcH+8vLy/v////7////+8vLy/sHBwf5cXFz+AAAA/gAAAP4AAAD+AAAA/gAAAP4AAAD+AAAA/gAAAP4ABl//A635/wD//wcAAAAAAAAAAAAAAAD/FntR0gM6/x4AA/8AAAD+AAAA/gAAAP4AAAD+AAAA/gAAAP4AAAD+AAAA/gAAAP4YGBj+Ly8v/i8vL/4YGBj+AAAA/gAAAP4AAAD+AAAA/gAAAP4AAAD+AAAA/gAAAP4AAAD+AAAm/wF24f8G/P9RAAAAAAAAAAAAAAAAAAAAAAAAAAD7CoezpQA//wwAAv0AAAD+AAAA/gAAAP4AAAD+AAAA/gAA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AP8AAAD/AAAA/xUVFf/w8PD//////////////////////////////////////7S0tP8NDQ3/AAAA/wAAAP8AAAD/AAAA/wAAAP8dAoP/iRj/Qd2UA5hKCwD/AAAA/wAAAP8AAAD/AAAA/5SUlP////////////////+RkZH/Kysr/ysrK/+fn5//qamp/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8DAEr/QBvtmMpsA9woAAD/AAAA/wAAAP8AAAD/CAgI/+np6f///////////5KSkv8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AACn/HiLW3L9UA/8aAAD/AAAA/wAAAP8AAAD/IyMj/////////////////yYmJv8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AABv/ES3L/8BHBP8aAAD/AAAA/wAAAP8AAAD/IyMj/////////////////yYmJv8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AABv/Cz7M/8xDBtwnAAD/AAAA/wAAAP8AAAD/CAgI/+np6f///////////5KSkv8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AACr/CVzZ3ORDCJhIAgD/AAAA/wAAAP8AAAD/AAAA/5SUlP////////////////+RkZH/Kioq/ysrK/+enp7/paWl/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8BB0//CIjzmP9HGEGDCgT/AAAA/wAAAP8AAAD/AAAA/xUVFf/w8PD//////////////////////////////////////6+vr/8LCwv/AAAA/wAAAP8AAAD/AAAA/wAAAP8BLI7/DND/Qf9VVQa/EhT/DwAA/wAAAP8AAAD/AAAA/wAAAP8yMjL/8fHx//////////////////////////////////v7+/8fHx//AAAA/wAAAP8AAAD/AAAA/wAAE/8Dbsz/AP//BgAAAAD6GT9xdQIO/wAAAP8AAAD/AAAA/wAAAP8AAAD/FBQU/5WVlf/p6en/////////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AP9xBwD+GAQA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/EAAO/00ARP7HAbb/+QnqqQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADh/wg878YC/44YAP8pAwD/AAEA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wEBAf8ZGRn/MjIy/0FBQf9BQUH/MjIy/xkZGf8BAQH/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/xcAGv9YAGb/3wPl//8R/zwAAAAAAAAAAAAAAAAAAAAAAAAAAP//AALi4gT/uEgA/0gBAP8CAgD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8SEhL/XV1d/62trf/g4OD/+Pj4////////////+Pj4/+Dg4P+tra3/XV1d/xISEv8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wIAAv8fADL/cwCe/90J7f//AP8CAAAAAAAAAAAAAAAAAAAAAOf/CVbmoAH/dggA/xQDAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/1dXV//V1dX//////////////////////////////////////////////////////9XV1f9XV1f/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8JAA//KQBe/6ID4v/tEvxWAAAAAAAAAAAAAAAA//8AAeHWBP+yOwD/PQEA/wABAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8MDAz/lpaW////////////////////////////////////////////////////////////////////////////lpaW/xQUFP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/DwAw/0MApf+2DPD//wD/AQAAAAAAAAAA7/8LMOqnAv98CgD/FQMA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wwMDP+srKz///////////////////////////////////////////////////////////////////////7+/v///////////2xsbP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/BgAR/xUAb/98BvP/3yD/MAAAAAAAAAAA5+QGqclXAP9NAAD/AQEA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AQEB/5aWlv////////////7+/v//////////////////////////////////////////////////////////////////////v7+//x4eHv8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AgAB/wgARf80Acv/nhr6qQAAAAD//wAD37kE/aAgAP8qAQD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/V1dX/////////////v7+/////////////v7+//////////////////////////////////////////////////////+9vb3/FRUV/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wUAJv8PAJ7/ZBTw/f9V/wPw/w8j4ZID/3sHAP8TAgD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8SEhL/1dXV///////////////////////+/v7///////////+/v7//bGxs/0ZGRv9GRkb/bGxs/7+/v////////////729vf8VFRX/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wMAEv8EAHn/Og7w/6BJ/yPr6Qhb1GYB/10AAP8GAQD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP9dXV3///////////////////////7+/v///////////21tbf8ICAj/AAAA/wAAAP8AAAD/AAAA/woKCv9zc3P/qqqq/xoaGv8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wEBBv8DAFz/HQng/2hG/1vrzgeXwkIB/0cAAP8AAQD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wICAv+tra3/////////////////////////////////bW1t/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wEAAP8CAEb/DgXM/0dK/5fotgfosSkA/zcAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/xkZGf/g4OD///////////////////////////+/v7//BwcH/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8CADj/BwO6/zNQ++jnowf4phsA/y4AAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/zIyMv/4+Pj///////////////////////////9sbGz/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8CAC//BAKu/yVY+fjmlQf/oBMA/ykAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/0JCQv////////////////////////////////9GRkb/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8BACv/AwOo/xxj+P/niwf/nxAA/ykAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/0JCQv////////////////////////////////9GRkb/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8BACv/Agap/xdy+P/qhgj4pRAA/y0AAf8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/zIyMv/4+Pj///////////////////////////9ra2v/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8BADD/Agyw/xWG+vjthArosRMB/zYAAf8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/xkZGf/g4OD///////////////////////////+/v7//BgYG/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8BADr/Ahm9/xSg/OjxhwyXwxoC/0QAAf8AAQD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wICAv+tra3/////////////////////////////////bW1t/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wABAP8AAEr/AzDQ/xO//5f3jBFb1yUD/1kAAP8FAQH/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP9dXV3///////////////////////7+/v///////////2xsbP8HBwf/AAAA/wAAAP8AAAD/AAAA/wkJCf9ycnL/o6Oj/xYWFv8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wEBB/8AAGH/BFXm/xTd/1v/mR0j6DMH/3cAAP8RAQH/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8SEhL/1dXV///////////////////////+/v7///////////+/v7//a2tr/0ZGRv9GRkb/a2tr/7+/v////////////7W1tf8RERH/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wEBFP8AAoL/BoX3/xb//yP//1UD6j8P/Z0AAf8mAQH/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/V1dX/////////////v7+/////////////v7+//////////////////////////////////////////////////////+2trb/ERER/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wEAK/8AGav/CLD3/QD//wMAAAAA9ksdqcwKBv9HAAL/AQEB/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AQEB/5aWlv////////////7+/v///////////////////////////////////////////////////////v7+////////////t7e3/xoaGv8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AQEC/wAAUP8BUdv/DN7/qQAAAAAAAAAA/1o6MPUaFP91AAP/EwEC/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wwMDP+srKz///////////////////////////////////////////////////////////////////////7+/v///////////2dnZ/8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAIX/wAGgf8Eo///EP//MAAAAAAAAAAA////AfMnLP+xAQj/NgAF/wAAAf8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8MDAz/lpaW////////////////////////////////////////////////////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AP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AwAD/xwAH/9EAFP+jACd//cG+f//EfktAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAHd8Qfq1pQA/5MYAP5ECAD/DAUA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wUFBf8eHh7/VVVV/5iYmP/Ly8v/6urq//r6+v////////////r6+v/q6ur/y8vL/5iYmP9VVVX/Hh4e/wUFBf8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8IAAn/IgAw/00Acv6pAcr/5wzu6v8A/wEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADi/wtH8NwC/7A6AP9jBwD/HAgA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AgIC/xsbG/9ra2v/zs7O/////////////////////////////////////////////////////////////////87Ozv9ra2v/Gxsb/wICAv8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/w8AFv8oAEv/XACa/9IG+P/0FvtHAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAB3+wG/dGAAP+KEAD+OAgA/wUDAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/BwcH/0JCQv/CwsL//////////////////////////////////////////////////////////////////////////////////////8LCwv9CQkL/CAgI/wEBAf8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8EAAX/FgAs/y8AdP59AMz/0w7x/f8A/wEAAAAAAAAAAAAAAAAAAAAA4/8JNvHYA/+wNgD/XwYA/xgHAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/CwsL/2ZmZv/19fX////////////+/v7//////////////////////////////////////////////////////////////////v7+////////////9fX1/2RkZP8ODg7/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/woAFP8aAE//PQCk/7II///sHP82AAAAAAAAAAAAAAAAAAAAAOPwB73ajQD/jxIA/joHAP8GAwD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/CwsL/3R0dP/////////////////+/v7////////////////////////////////////////////////////////////////////////////+/v7//v7+////////////RkZG/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8DAAX/DwAy/x4Agv5mAd//wRf3vgAAAAAAAAAAAAAAAOv/FA3w4gX/vUgA/2wGAP8fBwD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/BwcH/2ZmZv////////////7+/v///////////////////////////////////////////////////////////////////////////////////////v7+////////////xcXF/yYmJv8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wkAG/8RAGH/LQC8/5wR////O/8NAAAAAAAAAADl/ApP7LUC/6MeAP9MBQD/DQQA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AgIC/0JCQv/19fX///////7+/v///////////////////////////////////////////////////////////////////////////////////////v7+////////////w8PD/ygoKP8EBAT/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8EAAz/CwBF/xQAn/9jCfz/uC38TwAAAAAAAAAA5OgJs9l5Af+ICwD/MgYA/wICAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/xsbG//CwsL///////////////////////////////////////7+/v///////////////////////////////////////////////////////v7+////////////w8PD/ykpKf8BAQH/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AgAD/wcALv8LAIT/MALk/44o+7IAAAAA//8ABOLPBvzDRwD/bwUA/x8GAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wUFBf9ra2v////////////+/v7///////////////////////7+/v///////////+3t7f+kpKT/bW1t/1VVVf9VVVX/bW1t/6SkpP/t7e3/////////////////w8PD/ykpKf8BAQH/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8FAB3/BwBr/xQAy/9kIfb8/4D/BO7/ER7ouAT/sCcA/1gEAP8RBAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8fHx//zs7O///////+/v7///////////////////////7+/v///////////6ioqP85OTn/Dw8P/wQEBP8AAAD/AAAA/wQEBP8PDw//Ojo6/6enp///////w8PD/ygoKP8BAQH/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AwER/wYAVv8JALX/RBz7/6Fu/x7r+A5L5JgD/58UAP9FBAD/CQMA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8BAQH/VlZW//////////////////////////////////7+/v///////////4qKiv8VFRX/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wEBAf8XFxf/VFRU/ycnJ/8DAwP/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wIBCf8EAUT/BgCj/yoW9f90Zv9L6eUKgNx3Av+QCgD/NwQA/wQCAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/CgoK/5iYmP///////////////////////////////////////////6ioqP8UFBT/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8BAQT/AwE3/wQAk/8ZEuv/Vmb9gOvWCrDTWwH/gwYA/ywEAP8BAQD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/x0dHf/Ly8v//////////////////////////////////////+3t7f85OTn/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AQAB/wMBLf8DAIb/EA7h/0Np/q/pxwnuy0YB/3oEAP8lBAD/AAEA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8yMjL/6urq//////////////////////////////////////+kpKT/Dw8P/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8CASb/AwB9/wsN2P81bvvu6LoJ+sY4Af9zAgD/IQQA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/RUVF//r6+v//////////////////////////////////////bW1t/wMDA/8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AgEi/wIAd/8IDdL/KXX6+uiwCf/DLwH/cAIA/x4DAf8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/1BQUP///////////////////////////////////////////1RUVP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wICIP8CAHT/BhDQ/yJ++v/pqAn/wyoB/28CAP8eAwH/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP9QUFD///////////////////////////////////////////9UVFT/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8CAiD/AQB0/wUV0P8ei/r/6qMK+sYpAf9yAQD/IAMB/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/RUVF//r6+v//////////////////////////////////////bW1t/wMDA/8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AQIi/wEAeP8FHtT/G5v7+u2hC+7MKgH/eAEB/yQDAf8AAQD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/zIyMv/q6ur//////////////////////////////////////6Ojo/8PDw//AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAEA/wECJ/8BAID/BSza/xmu/e7wog+v1TAC/4EBAf8rAwH/AQEA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8dHR3/y8vL///////////////////////////////////////t7e3/OTk5/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wABAf8BAy//AQGK/wVB5P8ZxP+w8aMQgOA4A/+OAQD/NQIB/wQBAf8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/CwsL/5iYmP///////////////////////////////////////////6ioqP8UFBT/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8BAgX/AQM5/wADmP8HXu//GNf/gPitFEvqRAb/nQIA/0ICAf8JAgH/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wEBAf9WVlb//////////////////////////////////v7+////////////ioqK/xQUFP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AQEB/xcXF/9PT0//IyMj/wMDA/8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AQIK/wECSP8AC6n/CIP6/xju/0v/uxoe8VEJ/7AEAP9TAQH/EQIB/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/Hx8f/87Ozv///////v7+///////////////////////+/v7///////////+oqKj/OTk5/w8PD/8DAwP/AAAA/wAAAP8DAwP/Dw8P/zk5Of+mpqb//////7m5uf8jIyP/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wEDE/8BAlv/ABu8/wqp//8a//8e//9ABO1bD/zFCgL/aQAB/x0CAf8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wUFBf9sbGz////////////+/v7///////////////////////7+/v///////////+3t7f+jo6P/bW1t/1RUVP9UVFT/bW1t/6Ojo//t7e3/////////////////ubm5/yQkJP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8BBCH/AQJz/wE60/8Mxfv8QP//BAAAAAD0Zxiy3xYF/4MAAf8uAgL/AwEB/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/Gxsb/8LCwv///////////////////////////////////////v7+///////////////////////////////////////////////////////+/v7///////////+6urr/JCQk/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8BAgT/AQQ0/wAHj/8Cbu7/DuH/swAAAAAAAAAA9XQnT/gpDf+gAAL/RgEC/wwBAv8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wICAv9CQkL/9fX1///////+/v7///////////////////////////////////////////////////////////////////////////////////////7+/v///////////7m5uf8jIyP/AwMD/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AQQO/wADT/8AGK3/Ba7//xD1/08AAAAAAAAAAP+JOw3/Oxv/vwME/2UAA/8cAQP/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/BwcH/2ZmZv////////////7+/v///////////////////////////////////////////////////////////////////////////////////////v7+////////////u7u7/yEhIf8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAEA/wEGIf8ABHD/AELN/wje//8U//8NAAAAAAAAAAAAAAAA9EUvveMNDf+JAAX+NQEE/wYBAv8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8MDAz/dHR0//////////////////7+/v////////////////////////////////////////////////////////////////////////////7+/v/+/v7///////////9BQUH/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wEDCP8ABT3/AA6X/gKK8P8L7P+9AAAAAAAAAAAAAAAAAAAAAPpQUDb/ICT/rwAH/1cABv8WAQT/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wwMDP9mZmb/9fX1/////////////v7+//////////////////////////////////////////////////////////////////7+/v////////////X19f9kZGT/Dg4O/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8ABhr/AARj/wA0vP8F2P//Dvr/NgAAAAAAAAAAAAAAAAAAAAD/AP8B9CtB/dkFE/+DAAn+MgEG/wYBAv8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/BwcH/0NDQ//CwsL//////////////////////////////////////////////////////////////////////////////////////8LCwv9CQkL/CAgI/wEBAf8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAwf/AAY6/wAOkP4Ag+b/COr9/QD//wEAAAAAAAAAAAAAAAAAAAAAAAAAAPs2bEf/FDj/rwAO/1oBCv8ZAQb/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8CAgL/Gxsb/2tra//Ozs7/////////////////////////////////////////////////////////////////zs7O/2xsbP8bGxv/AgIC/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAQD/AAcf/wAFZ/8APLz/BOD//wv7/0cAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/AP8B9h1i6uAEJv+MABD+OwEL/wsBBf8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8FBQX/Hx8f/1ZWVv+YmJj/zMzM/+rq6v/6+vr////////////6+vr/6urq/8zMzP+YmJj/VlZW/x8fH/8FBQX/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAUO/wAGRv8AF5v+AJvt/wju/uoA//8BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP8oky3/EWX/vgAf/24AE/4nAAz/BAAD/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8BAQH/CwsL/x0dHf8zMzP/RUVF/1BQUP9QUFD/RUVF/zMzM/8dHR3/CwsL/wEBAf8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAMF/wAIL/8ACX3+AF7M/wT3//8L+f8tAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+hmQmvoGWf+lACL+VQAX/xsAC/8BAAH/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAIB/wAIIf8ABWT/ADe1/gLS//8H9f+aAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP8q1Qb/D5f/4QFS/5IAKf5GABn/FAAK/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAEA/wAHGP8ABlP/ACGi/gCm7f8G+P//AP//BgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/xXBJf8KqP/PAFT/hAAw/jwAHP8QAAr/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAEA/wAHFf8ABkn/ABeV/gCG3P8F////Dvj/JQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD8EMNR/waz/8UAXv97ADj+OAAf/xAAC/8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAEA/wAHFf8ABkb/ABKO/gB00v8D/v//Cfb/UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP0LyHP/A7//vwBr/3cAQv43ACT/EQAO/wEAAf8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAIB/wAHGP8ABkn/ABKO/gBuz/8D+P//Cfb/cwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/QrRf/8Dzv++AH7/dQBP/jgALf8VABT/BAAE/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAMG/wAHIf8ABVP/ABaV/gBz0v8D+P//CPX/fwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/Cdlz/wPf/8IAlv93AGL+PQA8/xsAHv8IAAr/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAQD/AAUO/wAHL/8ABGT/ACCi/gCG3P8D/v//Cfb/cwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPwJ4FL/Bez/zgC1/34Ae/5DAFL+IQAv/w8AFf8EAAb/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wABAP8AAwj/AAYf/wAFRv8AB33+ADa1/gCl7f8E////Cfn/UgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+A3lJ/kI5//jAtr/jACd/0wAcv4nAEv/FQAr/woAFP8EAAb/AQAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAEA/wADCP8ABRv/AAU6/wAEZ/8AFpv+AFzM/wLQ//8G9///Dfj/JwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/JP8H8wzrmvUG+P+pAcr/WwCZ/y4Ac/4ZAE//DgAx/wgAG/8EAAz/AgAD/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wABAP8BAgT/AQMP/wAFIf8ABD3/AANj/wANkP4AOrz/AJnt/wT2//8H9/+aAP//BwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD0EO8w5Azr6tEG9/99AMz/PACk/x0Agf4QAGH/CgBE/wcALv8EAB3/AwAR/wIBCv8BAQX/AQEC/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAEA/wEBAv8BAQX/AQIL/wEDE/8BBCH/AAM0/wACT/8AAnD/AA2X/gAzvP8Ageb/BN7//wju/uoL+v8wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP8A/wHqFfVK0A7w/bII/v9mAd//LAC8/xMAnv8KAIP/BwBq/wUAVf8EAET/AwE2/wIBLP8CASb/AgEi/wIBIP8BASD/AQIi/wECJ/8BAi7/AQI5/wEBSP8BAVv/AQFz/wAFj/8AFq3/AEDM/wGI8P8F1v//COn9/Q78/0oA//8BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP8A/wHkG/84vhX2v5sQ//9jCPv/MAHj/xMAyv8JALX/BQCi/wQAk/8DAIb/AgB9/wIAdv8BAHP/AQB0/wEAeP8BAH//AACJ/wACl/8ACaj/ABm8/wE40/8Ca+3/Bav//wjc//8L6v+/Dv//OAD//wEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADdM/8Pti3/UIwm+bRiIPX9Qxv6/ykV9f8YEev/Dw3g/woM2P8HDdL/Bg/P/wUU0P8EHNP/BCra/wU/4/8GW+//CID6/wqm//8Mw/r9DuD+tBP1/1AR//8PAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAzGb/BZxr/x9xY/9NVWH9gUFm/LEza/zuKXL6+iJ7+v8diPr/Gpj7+hmt/e4Zwf+wGNX/gRfr/00Z//8fM///BQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
};
