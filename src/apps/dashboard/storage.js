import { persistable } from "storables";

export default function chromePersistable(name, default_value) {
    const stores = persistable({
        name,
        io: {
            read() {
                return new Promise((resolve) => {
                    chrome.storage.local.get(name, (storage) => {
                        const value = Object.hasOwnProperty.call(storage, name)
                            ? storage[name]
                            : undefined;
                        resolve(value);
                    });
                });
            },
            update(set) {
                function setStorageValue(storage) {
                    if (storage[name]?.newValue) {
                        set(storage[name].newValue);
                    }
                }

                chrome.storage.onChanged.addListener(setStorageValue);

                return () => {
                    chrome.storage.onChanged.removeListener(setStorageValue);
                };
            },
            write(value) {
                chrome.storage.local.set({ [name]: value });
            },
        }
    }, default_value);

    return stores;
}