import { persist } from './store';

const { writable } = persist("lisa-ext-settings");
// hide set and destroy operations
const { get, update, subscribe, reset } = writable({
    focus: {
        duration: 25,
        timer_sound: null,
        notifications: {
            desktop: true,
            tab: true,
            sound: null
        }
    },
    short_break: {
        duration: 5,
        timer_sound: null,
        notifications: {
            desktop: true,
            tab: true,
            sound: null
        }
    },
    long_break: {
        duration: 15,
        interval: 4,
        timer_sound: null,
        notifications: {
            desktop: true,
            tab: true,
            sound: null
        }
    },
});

export default {
    settings_writable: { get, update, subscribe, reset },
    settings_readable: { get, subscribe }
};

