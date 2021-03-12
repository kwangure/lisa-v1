import { target, watch } from "proxy-watcher";
import { defaultSettings } from "../common/settings";

// eslint-disable-next-line no-undef
const storage = chrome.storage.local;

export default function createSettings() {
    return new Promise((resolve) => {
        storage.getBytesInUse("settings", async (bytesInUse) => {
            let settings = {};
            if (bytesInUse === 0) {
                settings = defaultSettings;
                storage.set({ settings });
            } else {
                settings = await new Promise((resolve) => {
                    storage.get("settings", (result) => {
                        resolve(result.settings);
                    });
                });
            }

            const [proxy] = watch(settings, () => {
                storage.set({ settings: target(proxy) });
            });

            storage.onChanged.addListener(({ settings }) => {
                Object.assign(proxy, settings.newValue);
            });

            resolve(proxy);
        });
    });
}
