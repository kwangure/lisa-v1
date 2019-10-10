import { persist } from './store';

const { writable } = persist("lisa-ext-settings");
// hide set and destroy operations
const { get, update, subscribe, reset } = writable({
    focus: {
        duration: 1500,
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

const settings_writable = { get, update, subscribe, reset }
const settings_readable = { get, subscribe }

export { settings_writable, settings_readable };

