import { minutesToMilliseconds } from "../../../utils/time";

export const timerPositions = {
    BOTTOM_LEFT: {
        value: "bottom-left",
        name: "Bottom left",
    },
    BOTTOM_RIGHT:{
        value: "bottom-right",
        name: "Bottom right",
    },
};

export const defaultSettings = {
    appearanceSettings: {
        timerPosition: timerPositions.BOTTOM_RIGHT.value,
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