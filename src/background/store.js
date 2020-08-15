import { writable as svelteWritable } from "svelte/store";

export function createLocalStorageWritable(name) {
    return function writable(defaultValue, start) {
        let existingStore = JSON.parse(localStorage.getItem(name));

        if (existingStore === null) {
            localStorage.setItem(name, JSON.stringify(defaultValue));
            existingStore = defaultValue;
        }

        const { set, update, subscribe } = svelteWritable(existingStore, start);

        const unsubscribe = subscribe((newValue) => {
            localStorage.setItem(name, JSON.stringify(newValue));
        });

        return {
            set,
            update,
            subscribe,
            cleanUp(){
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