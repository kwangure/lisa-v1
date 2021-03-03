import { getSettings } from "../../../background/settings-2.js";
import { readable } from "svelte/store";
import { settings } from "../../events";

export function createSettingsWritable() {
    const initialSettings = getSettings();

    const settingsReadable = readable(initialSettings, (setReadableValue) => {
        const unsubscribe = settings.on("CHANGED", (settings) => {
            setReadableValue(settings);
        });
        return unsubscribe;
    });

    return {
        ...settingsReadable,
        set(settingsObj) {
            settings.update(settingsObj);
        },
    };
}
