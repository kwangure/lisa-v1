import { writable as svelteWritable } from "svelte/store";

export function createLocalStorageWritable(name) {
    return function writable(defaultValue, start) {
        let existingStore = JSON.parse(localStorage.getItem(name));
        let cachedValue = null;

        if (existingStore === null) {
            localStorage.setItem(name, JSON.stringify(defaultValue));
            existingStore = defaultValue;
        }

        const { set, update, subscribe: sveltSubscribe } = svelteWritable(existingStore, start);

        const subscribers = new Set();

        function subscribe(fn) {
            subscribers.add(fn);
            return () => subscribers.delete(fn);
        }

        const unsubscribe = sveltSubscribe((newValue) => {
            if (JSON.stringify(newValue) === JSON.stringify(cachedValue)){
                return;
            }
            localStorage.setItem(name, JSON.stringify(newValue));
            cachedValue = newValue;
            for (const subscriber of subscribers) {
                subscriber(newValue);
            }
        });

        return {
            value() {
                return cachedValue;
            },
            set,
            update,
            subscribe,
            cleanUp(){
                subscribers = new Set();
                unsubscribe();
            },
            reset(){
                set(defaultValue);
            },
        };
    };
}

export function createLocalStorageReadable(name) {
    return function readable(defaultValue, start) {
        const writable = createLocalStorageWritable(name);
        const { subscribe, cleanUp, reset } = writable(defaultValue, start);
        return { subscribe, cleanUp, reset };
    };
}