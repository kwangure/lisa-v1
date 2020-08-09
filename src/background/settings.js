import { minutesToMilliseconds } from "../utils/time.js";
import { createLocalStorageWritable } from "./store.js";

const defaultSettings = {
    focus: {
        duration: minutesToMilliseconds(50),
        notification: {
            sound: null,
        }
    },
    shortBreak: {
        duration: minutesToMilliseconds(10),
        notification: {
            sound: null,
        }
    },
    longBreak: {
        duration: minutesToMilliseconds(30),
        notification: {
            sound: null,
        }
    },
};

const writable = createLocalStorageWritable("settings");

export default writable(defaultSettings);