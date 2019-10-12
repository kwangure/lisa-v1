
import { writable } from "svelte/store";
import emit from "../background/emitter_observer"
import { events } from "../background/pomodoro_store"

let pomodoro = writable({});

async function respond(message, sender, sendResponse) {
    pomodoro.set(message)
    sendResponse({});
    return true;
}

chrome.runtime.onMessage.addListener(respond);

window.onclose = () => chrome.runtime.onMessage.removeListener(respond);

export const timer_actions = {
    
}

/*function restart_timer() {
    
}

function restart_cycle() {
    
}*/

export function timer_readable() {
    return { 
        subscribe: pomodoro.subscribe,
        start: function () {
            emit(events.START)
        },
        stop: function () {
            emit(events.STOP)
        },
        pause: function () {
            emit(events.PAUSE)
        },
        resume: function () {
            emit(events.RESUME)
        }
    }
}
