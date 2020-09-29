import { readable } from "svelte/store";
import { minutesToMilliseconds } from "../../utils/time";
import { settings, EventListener } from "../events";

export const defaultSettings = {
    appearanceSettings: {

    },
    phaseSettings: {
        focus: {
            duration: minutesToMilliseconds(50),
            notification: {
                sound: null,
            },
        },
        shortBreak: {
            duration: minutesToMilliseconds(10),
            notification: {
                sound: null,
            },
        },
        longBreak: {
            duration: minutesToMilliseconds(30),
            notification: {
                sound: null,
            },
        },
    },
};

export function createSettingsWritable() {
    const settingsReadable = readable(defaultSettings, (setReadableValue) => {
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