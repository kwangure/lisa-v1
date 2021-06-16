import clone from "just-clone";
import compare from "just-compare";
import { defaultSettings } from "~@common/settings";
import { writable } from "svelte/store";

// eslint-disable-next-line no-undef
const storage = chrome.storage.local;

export default function createSettingStore() {
    const settingCache = defaultSettings;
    const settingsWritable = writable(settingCache);

    function hasSettingsChanged(settings) {
        return !compare(settingCache, settings);
    }

    storage.getBytesInUse("settings", (bytesInUse) => {
        if (bytesInUse !== 0) {
            storage.get("settings", ({ settings }) => {
                settingsWritable.set(settings);
                Object.assign(settingCache, clone(settings));
            });
        }

        settingsWritable.subscribe((settings) => {
            if (!hasSettingsChanged(settings)) return;
            storage.set({ settings });
            Object.assign(settingCache, clone(settings));
        });

        storage.onChanged.addListener(({ settings }) => {
            if (!hasSettingsChanged(settings.newValue)) return;
            settingsWritable.set(settings.newValue);
            Object.assign(settingCache, settings.newValue);
        });
    });

    return settingsWritable;
}
