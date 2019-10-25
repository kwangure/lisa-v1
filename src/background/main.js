import timer from './timer'
import { pomodoro_readable, events } from './pomodoro_store'
import { sound_store } from './sound_store'
import { settings_writable } from './settings_store'
import emit from './emit'
import { service_requests } from './service';
import notification from './notification';

(function () {
    chrome.runtime.onUpdateAvailable.addListener(() => {
        // We must listen to (but do nothing with) the onUpdateAvailable event in order to
        // defer updating the extension until the next time Chrome is restarted. We do not want
        // the extension to automatically reload on update since a Pomodoro might be running.
        // See https://developer.chrome.com/apps/runtime#event-onUpdateAvailable.
    });

    let settings    = settings_writable();
    let pomodoro    = pomodoro_readable(timer, settings);
    let sound       = sound_store();

    let pomodoro_subscribers = {
        [null]: [],
        [events.EXPIRE]: [notification],
        [events.EXTEND]: [],
        [events.PAUSE]: [],
        [events.RESUME]: [],
        [events.START]: [],
        [events.STOP]: [],
        [events.TICK]: [],
    };

    pomodoro.subscribe(value => {
        const { transition, ...pomodoro_state } = value;
        emit(transition, pomodoro_state);
        // since sendMessage doesn't work in the sender's frame
        // we have to call background script subscribers manually
        let subscribers = pomodoro_subscribers[transition];
        subscribers.forEach(fn => fn(pomodoro));
    });

    settings.subscribe(value => emit("settings-change", value));

    // listen to requests from outside background script
    service_requests.listen({
        pomodoro, 
        settings,
        sound,
    });
    
    // Begin pomodoro in stopped state
    pomodoro.stop();
})()