import { target, watch } from "proxy-watcher";
import { defaultSettings } from "../common/settings";

// eslint-disable-next-line no-undef
const storage = chrome.storage.local;

export default function createSettings() {
    const settings = defaultSettings;
    const [proxy] = watch(settings, () => {
        storage.set({ settings: target(proxy) });
    });
    const listeners = new Set();
    function addListener(fn) {
        listeners.add(fn);
    }

    storage.onChanged.addListener(({ settings }) => {
        const { newValue } = settings;

        for (const listener of listeners) {
            listener(newValue);
        }

        Object.assign(proxy, newValue);
    });

    storage.getBytesInUse("settings", (bytesInUse) => {
        if (bytesInUse !== 0) {
            storage.get("settings", (result) => {
                Object.assign(proxy, result.settings);
            });
        }
    });

    return {
        settings: proxy,
        addListener: addListener,
    };
}
