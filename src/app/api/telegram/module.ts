export default function getTelegram(telegram?: Telegram["WebApp"]) {
    telegram = telegram || ((global || window) as any)?.Telegram?.WebApp;
    let user: Telegram["WebApp"]["initDataUnsafe"]["user"] | undefined;

    if (telegram) {
        telegram.ready();
        if (telegram.BiometricManager) {
            telegram.BiometricManager.init();
        }
        user = telegram.initDataUnsafe?.user;
    }

    const modules = {
        bio: {
            request: (reason?: string) => telegram && telegram.BiometricManager.requestAccess({ reason }),
            auth: (reason?: string) => telegram && telegram.BiometricManager.authenticate({ reason }),
        },

        storage: telegram && telegram?.CloudStorage,

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

        exit: (callback?: () => void) => {
            if (telegram) {
                telegram?.close();
                telegram?.MainButton?.offClick(() => {
                    user = undefined;
                    callback?.();
                });
            }
        },
    };

    return { telegram, user, ...modules };
}
