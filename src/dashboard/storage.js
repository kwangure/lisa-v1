import { writable } from "./object-writable.js";

const { storage } = chrome;

function getInitialValue(name, defaultValue) {
    return new Promise((resolve) => {
        storage.local.get(name, (storageValue) => {
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
function later(store, run) {
    let listen = false;
    return store.subscribe((value) => {
        if (listen) return run(value);
        listen = true;
    });
}

export default function chromeStorageWritable(name, defaultValue) {
    const { get, set, subscribe, update } = writable(null, async (set) => {
        set(await getInitialValue(name, defaultValue));

        function setStorageValue(storage) {
            if (storage[name]) {
                set(storage[name].newValue);
            }
        }

        storage.onChanged.addListener(setStorageValue);

        return () => {
            storage.onChanged.removeListener(setStorageValue);
        };
    });

    // If we blindly subscribe to the writable it will always have at least
    // one subscriber (us) and wont get to zero and run `removeListener`.
    // So we track subscriber count then subscribe/unsubscribe accordingly.
    let cleanup = () => {};
    let subscribeCount = 0;
    function customSubscribe(fn) {
        const unsubscribe = subscribe(fn);
        subscribeCount += 1;
        if (subscribeCount === 1) {
            cleanup = later({ subscribe }, (value) => {
                if (value !== undefined) {
                    storage.local.set({ [name]: value });
                }
            });
        }

        return () => {
            unsubscribe();
            subscribeCount -= 1;
            if (subscribeCount === 0) cleanup();
        };
    }

    return {
        get,
        set,
        subscribe: customSubscribe,
        update,
    };
}
