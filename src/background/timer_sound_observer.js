import { events as pomodoro_events } from './pomodoro_store';
import { events as settings_events } from './settings_store';

let settings = {};

export default new Map([
    [pomodoro_events.EXPIRE, () => {}],
    [pomodoro_events.EXTEND, () => {}],
    [pomodoro_events.PAUSE, () => {}],
    [pomodoro_events.RESUME, () => {}],
    [pomodoro_events.START, () => {}],
    [pomodoro_events.STOP, () => {}],
    [settings_events.CHANGE, (store_state) => {
        settings = store_state;
    }],
]); 