import EventEmitter from "eventemitter3";

export const namefield = "coinmeca:wallet";

export abstract class CoinmecaWalletBase {
    protected readonly codename = namefield;
    protected readonly event: EventEmitter;

    constructor() {
        this.event = new EventEmitter();
        this.#proxy;
    }

    get #proxy() {
        const handler = {
            get: (target: any, prop: string) => {
                if (typeof target[prop] === "function") return (...args: any[]) => target[prop](...args);
                return target[prop];
            },
        };

        return new Proxy(this, handler);
    }

    // Event handling with EventEmitter3
    on(event: string, listener: (...args: any[]) => void, context?: any): this {
        this.event.on(event, listener);
        return this;
    }

    off(event: string, listener: (...args: any[]) => void, context?: any): this {
        this.event.off(event, listener);
        return this;
    }

    emit(event: string, ...args: any[]): void {
        this.event.emit(event, ...args);
    }
}
