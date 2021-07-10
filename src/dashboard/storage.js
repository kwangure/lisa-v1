import { writable } from "./object-writable.js";

function getInitialValue(name, defaultValue) {
    return new Promise((resolve) => {
        chrome.storage.local.get(name, (storageValue) => {
            if (Object.hasOwnProperty.call(storageValue, name)) {
                resolve(storageValue[name]);
            } else {
                resolve(defaultValue);
            }
        });
    });
}

/**
 * Ignore first function call of with initial value.
 * Only listen to store changes.
 *
 * @param {import("svelte/store").Writable} store A svelte store
 * @param {import("svelte/store").Subscriber} run A subscribtion function
 * @returns {function} unsubsription function
 */
export function later(store, run) {
    let listen = false;
    return store.subscribe((value) => {
        if (listen) return run(value);
        listen = true;
    });
}

export default function chromeStorageWritable(name, defaultValue) {
    const store = writable(null, async (set) => {
        set(await getInitialValue(name, defaultValue));

        function setStorageValue(storage) {
            if (storage[name]) {
                set(storage[name].newValue);
            }
        }

        chrome.storage.onChanged.addListener(setStorageValue);

        return () => {
            chrome.storage.onChanged.removeListener(setStorageValue);
        };
    });

    // Set directly to Chrome's storage.
    // The listener will propagate to the writable.
    function set(value) {
        if (value !== undefined) {
            chrome.storage.local.set({ [name]: value });
        } else {
            console.error(`Cannot set '${name}' storage to "undefined"`);
        }
    }

    return {
        get() {
            return new Promise((resolve) => {
                const unsubscribe = later(store, (value) => {
                    resolve([value, unsubscribe]);
                });
            });
        },
        set,
        subscribe: store.subscribe,
        async update(fn) {
            set(fn(await this.getAsync()));
        },
    };
}
