import { persist } from './store';

const { writable } = persist("lisa-ext-settings");
// hide destroy operation
const { get, set, update, subscribe, reset } = writable({
    focus: {
        duration: 5,
        timer_sound: null,
        notifications: {
            desktop: true,
            tab: true,
            sound: null
        }
    },
    short_break: {
        duration: 300,
        timer_sound: null,
        notifications: {
            desktop: true,
            tab: true,
            sound: null
        }
    },
    long_break: {
        duration: 300,
        interval: 4,
        timer_sound: null,
        notifications: {
            desktop: true,
            tab: true,
            sound: null
        }
    },
});

const settings_writable = { get, set, update, subscribe, reset }
const settings_readable = { get, subscribe }

export { settings_writable, settings_readable };

