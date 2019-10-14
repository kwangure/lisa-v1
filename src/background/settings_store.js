import { persist } from './store';

const { writable } = persist("lisa-ext-settings");
// hide destroy operation
const { get, set, update, subscribe, reset } = writable({
    focus: {
        duration: 5,
        timer_sound: {
            file: null,
            bpm: null,
        },
        notifications: {
            desktop: true,
            tab: true,
            sound: null
        }
    },
    short_break: {
        duration: 300,
        timer_sound: {
            file: null,
            bpm: null,
        },
        notifications: {
            desktop: true,
            tab: true,
            sound: null
        }
    },
    long_break: {
        duration: 300,
        interval: 4,
        timer_sound: {
            file: null,
            bpm: null,
        },
        notifications: {
            desktop: true,
            tab: true,
            sound: null
        }
    },
});

export function settings_writable () {
    return { get, set, update, subscribe, reset }
}
export function settings_readable () {
    return { get, subscribe }
}
