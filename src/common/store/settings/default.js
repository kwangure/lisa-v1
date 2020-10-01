import { minutesToMilliseconds } from "../../../utils/time";

export const timerPositions = {
    BOTTOM_LEFT: "bottom-left",
    BOTTOM_RIGHT: "bottom-right",
    TOP_RIGHT: "top-right",
    TOP_LEFT: "top-left",
};

export const defaultSettings = {
    appearanceSettings: {
        timerPosition: timerPositions.BOTTOM_RIGHT,
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