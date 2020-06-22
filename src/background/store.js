import { writable, readable } from "svelte/store";

function storage_available() {
    try {
        var storage = window["localStorage"],
            x = "__storage_test__";
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    }
    catch(e) {
        console.error(
            e instanceof DOMException && (
                e.code === 22 ||
            e.code === 1014 ||
            e.name === "QuotaExceededError" ||
            e.name === "NS_ERROR_DOM_QUOTA_REACHED") &&
            storage && storage.length !== 0,
        );
        return false;
    }
}

function get_storage_JSON(key) {
    let value = localStorage.getItem(key);
    try {
        return JSON.parse(value);
    } catch(e) {
        console.log(value);
        console.error(e, "Could not parse", value);
        return {};
    }
}

function noop() { }

export function persist(storeName) {
    if (!storage_available()) return {
        writable:{},
        readable:{},
    };

    let key = storeName;
    let store = function (value, start=noop) {
        let old_value = get_storage_JSON(key);
        const { subscribe, set } = writable(old_value, start);
        const subscribers = [];

        let actions = {
            get: function() {
                return get_storage_JSON(key);
            },
            set: function(new_value) {
                localStorage.setItem(key, JSON.stringify(new_value));
                set(new_value);
            },
            subscribe: function (subscriber) {
                let unsubscribe = subscribe(subscriber);
                subscribers.push(unsubscribe);
                return unsubscribe;
            },
            update: function (update_fn) {
                return this.set(update_fn());
            },
            reset: function() {
                return this.set(value);
            },
            destroy: function() {
                subscribers.forEach(unsubscribe => unsubscribe());
                value = get_storage_JSON(key);
                localStorage.removeItem(key);
                return value;
            },
        };

        if(!old_value && value) actions.set(value);

        return actions;
    };

    let readable = function(value) {
        let { get, subscribe, destroy } = store(value);
        return { get, subscribe, destroy };
    };

    return { writable: store, readable };
}

export { writable, readable };