import timer from './timer'
import { pomodoro_store, events } from './pomodoro_store'
import { settings_writable, settings_readable } from './settings_store'
import emit from './emit'
import { service_requests } from './service';
// import history_observer from './history_observer'
// import notification_observer from './notification_observer'
// import timer_sound_observer from './timer_sound_observer'

function start() {
    chrome.runtime.onUpdateAvailable.addListener(() => {
        // We must listen to (but do nothing with) the onUpdateAvailable event in order to
        // defer updating the extension until the next time Chrome is restarted. We do not want
        // the extension to automatically reload on update since a Pomodoro might be running.
        // See https://developer.chrome.com/apps/runtime#event-onUpdateAvailable.
    });

    let pomodoro    = pomodoro_store(timer, settings_readable);
    //let messages    = message_store();
    //let history     = history_store();
    pomodoro.subscribe(Object.values(events), emit);
    service_requests.listen({
        pomodoro, 
        settings: settings_writable
    });
    // pomodoro.subscribe(events.EXPIRE, notification_observer);
    // pomodoro.subscribe(events.TICK, timer_sound_observer);
    // pomodoro.subscribe([events.EXPIRE, events.EXTEND], history_observer(history));
    
    // Begin pomodoro in stopped state
    pomodoro.stop();
}


start();