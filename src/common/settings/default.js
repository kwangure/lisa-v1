import { minutesToMilliseconds } from "~@utils/time";

export const timerPositions = {
    BOTTOM_LEFT: {
        value: "bottom-left",
        name: "Bottom left",
    },
    BOTTOM_RIGHT: {
        value: "bottom-right",
        name: "Bottom right",
    },
};

export const phaseNames = {
    focus: "Focus",
    shortBreak: "Short Break",
    longBreak: "Long Break",
};

export const defaultSettings = {
    appearanceSettings: {
        timerPosition: timerPositions.BOTTOM_RIGHT.value,
    },
    phaseSettings: {
        focus: {
            duration: minutesToMilliseconds(50),
            pauseDuration: minutesToMilliseconds(3),
            warnRemaining: minutesToMilliseconds(5),
            notification: {
                sound: null,
            },
        },
        shortBreak: {
            duration: minutesToMilliseconds(10),
            pauseDuration: minutesToMilliseconds(1),
            warnRemaining: minutesToMilliseconds(1),
            notification: {
                sound: null,
            },
        },
        longBreak: {
            duration: minutesToMilliseconds(30),
            pauseDuration: minutesToMilliseconds(1),
            warnRemaining: minutesToMilliseconds(1),
            interval: 4,
            notification: {
                sound: null,
            },
        },
        // Caches the last disable duration a user used.
        disabled: {
            duration: 0,
        },
    },
};
