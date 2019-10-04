import timer from './timer'
import { pomodoro_store } from './pomodoro_store'
import { settings_writable, settings_readable } from './settings_store'

chrome.runtime.onUpdateAvailable.addListener(() => {
    // We must listen to (but do nothing with) the onUpdateAvailable event in order to
    // defer updating the extension until the next time Chrome is restarted. We do not want
    // the extension to automatically reload on update since a Pomodoro might be running.
    // See https://developer.chrome.com/apps/runtime#event-onUpdateAvailable.
});

let pomodoro = pomodoro_store(timer, settings_readable);
pomodoro.start()