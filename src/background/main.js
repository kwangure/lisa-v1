import timer from './timer'
import { pomodoro_store, events } from './pomodoro_store'
import { settings_writable, settings_readable } from './settings_store'

function emit_tabs(message){
    if(chrome.tabs){
        chrome.tabs.query({}, function(tabs){
            for (let i = 0, len = tabs.length; i < len; i++) {
            chrome.tabs.sendMessage(tabs[i].id, message, {}, ()=>{});
            }
        })
    }
}

function emit_runtime(message) {
    chrome.runtime.sendMessage(message);
}

function start() {
    chrome.runtime.onUpdateAvailable.addListener(() => {
        // We must listen to (but do nothing with) the onUpdateAvailable event in order to
        // defer updating the extension until the next time Chrome is restarted. We do not want
        // the extension to automatically reload on update since a Pomodoro might be running.
        // See https://developer.chrome.com/apps/runtime#event-onUpdateAvailable.
    });

    let pomodoro = pomodoro_store(timer, settings_readable);

    pomodoro.subscribe(Object.values(events), function(event_name) {
        let message = {
            event: event_name,
            ...pomodoro.get_status(),
        };
        emit_tabs(message);
        emit_runtime(message);
    })

    pomodoro.start()
}

start