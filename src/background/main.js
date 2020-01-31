import timer from './timer'
import { pomodoro_readable, events as pomodoro_events } from './pomodoro_store'
import { sound_store } from './sound_store'
import { settings_writable, events as settings_events } from './settings_store'
import emit from './emit'
import { service_requests } from './service';
import notification_observer from './notification_observer';

(function () {
    chrome.runtime.onUpdateAvailable.addListener(() => {
        // We must listen to (but do nothing with) the onUpdateAvailable event in order to
        // defer updating the extension until the next time Chrome is restarted. We do not want
        // the extension to automatically reload on update since a Pomodoro might be running.
        // See https://developer.chrome.com/apps/runtime#event-onUpdateAvailable.
    });

    let settings = settings_writable();
    let pomodoro = pomodoro_readable(timer, settings);
    let sound = sound_store();

    let subscriptions = new Map([
        [pomodoro_events.EXPIRE, []],
        [pomodoro_events.EXTEND, []],
        [pomodoro_events.PAUSE, []],
        [pomodoro_events.RESUME, []],
        [pomodoro_events.START, []],
        [pomodoro_events.STOP, []],
        [pomodoro_events.TICK, []],
        [settings_events.CHANGE, []],
    ]);

    let observers = [
        notification_observer,
    ];

    let stores = [
        pomodoro,
        settings,
    ]

    // marry all events and listeners from observers
    subscriptions.forEach((subscribers, event) => {
        observers.forEach(observer => {
            if(observer.has(event)) {
                let event_fn = observer.get(event);
                subscribers.push(event_fn)
            }
        });
        
        subscriptions.set(event, subscribers);
    })

    // subscribe to emit events to background and external scripts
    stores.forEach(store => {
        store.subscribe(value => {
            // emit to external scripts
            const { event, ...store_state } = value;
            emit(event, store_state);
            // emit to background scripts
            if(subscriptions.has(event)) {
                let subscribers = subscriptions.get(event);
                // TODO: don't pass store. Modify store using events only.
                subscribers.forEach(fn => fn(store_state, store));
            }
        });
    });

    // listen to requests from outside background script
    service_requests.listen({
        pomodoro, 
        settings,
        sound,
    });
    
    // Begin pomodoro in stopped state
    pomodoro.stop();
})()