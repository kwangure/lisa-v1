import { defaultSettings } from "../../../common/store/settings/default";
import { writable } from "svelte/store";

// eslint-disable-next-line no-undef
const storage = chrome.storage.local;

export default function createSettingStore() {
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

            const settingsWritable = writable(settings);

            settingsWritable.subscribe((settings) => {
                storage.set({ settings });
            });

            storage.onChanged.addListener(({ settings }) => {
                settingsWritable.set(settings.newValue);
            });

            resolve(settingsWritable);
        });
    });
}
