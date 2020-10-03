import { readable } from "svelte/store";
import { settings } from "../../events";

export async function createSettingsWritable() {
    const initialSettings = await settings.getState();

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