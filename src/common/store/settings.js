import { readable } from "svelte/store";
import { settings, EventListener } from "../events";

export async function createSettingsWritable() {
    const initialValue = await settings.getState();

    const settingsReadable = readable(initialValue, (setReadableValue) => {
        const settingsEventsListener = new EventListener("BACKGROUND.SETTINGS");
        const unsubscribe = settingsEventsListener.on("CHANGED", (settings ) => {
            setReadableValue(settings );
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