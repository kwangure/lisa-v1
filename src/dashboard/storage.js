import clone from "just-clone";
import get from "get-value";
import set from "set-value";

const storage = chrome.storage.local;
const _ALL_KEYS = "all-keys";

export default class Storage {
    constructor(name, defaultValue = {}) {
        this._name = name;
        this._value = clone(defaultValue);
        this._subscribers = new Map();
        this._ready = new Promise((resolve) => {
            storage.getBytesInUse(name, (bytesInUse) => {
                if (bytesInUse !== 0) {
                    storage.get(name, (storeValue) => {
                        this._value = storeValue[name];
                        console.log({ storeValue, name, thisValue: this._value });
                        resolve(this);
                    });
                } else {
                    resolve(this);
                }
            });
        });

        storage.onChanged.addListener((storageValue) => {
            this._value = storageValue[name];

            for (const [key, subscribers] of this._subscribers) {
                for (const subscriber of subscribers) {
                    subscriber(clone(this._value[key]));
                }
            }
        });
    }
    onready() {
        return this._ready;
    }
    _persist() {
        storage.set({ [this._name]: this._value });
    }
    get(key) {
        return clone(key
            ? get(this._value, key)
            : this._value);
    }
    set(key, value) {
        set(this._value, key, value);
        this._persist();
    }
    subscribe(key, fn) {
        if (typeof key === "function") {
            [key, fn] = ["all-keys"]
        }

        let keySubscribers = this._subscribers.get(key);
        if (keySubscribers) {
            keySubscribers.add(fn);
        } else {
            keySubscribers = new Set([fn]);
            this._subscribers.set(key, keySubscribers);
        }

        return () => {
            keySubscribers.delete(key);
        };
    }
}
