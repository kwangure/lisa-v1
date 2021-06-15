import { target, watch } from "proxy-watcher";
import { defaultSettings } from "../common/settings";

// eslint-disable-next-line no-undef
const storage = chrome.storage.local;

export default function createSettings() {
    const settings = defaultSettings;
    const [proxy] = watch(settings, () => {
        storage.set({ settings: target(proxy) });
    });

    storage.onChanged.addListener(({ settings }) => {
        Object.assign(proxy, settings.newValue);
    });

    storage.getBytesInUse("settings", (bytesInUse) => {
        if (bytesInUse !== 0) {
            storage.get("settings", (result) => {
                Object.assign(proxy, result.settings);
            });
        }
    });

    return proxy;
}
