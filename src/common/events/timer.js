import { emit, request } from "./emit.js";
import { EventListener } from "./listen.js";

const timerEventsListener = new EventListener("BACKGROUND.TIMER");

async function getState() {
    return request({ namespace: "BACKGROUND.TIMER", query: "FETCH" });
}

async function isInitialized() {
    return request({ namespace: "BACKGROUND.TIMER", query: "IS_INITIALIZED" });
}

async function start() {
    return request({ namespace: "BACKGROUND.TIMER", query: "START" });
}

async function pause() {
    emit({ event: "PAUSE", namespace: "BACKGROUND.TIMER" });
}

async function play() {
    emit({ event: "PLAY", namespace: "BACKGROUND.TIMER" });
}

async function reset() {
    emit({ event: "RESET", namespace: "BACKGROUND.TIMER" });
}

async function destroy() {
    emit({ event: "DESTROY", namespace: "BACKGROUND.TIMER" });
}

function saveUpdate() {
    emit({ event: "DURATION.UPDATE.SAVE", namespace: "BACKGROUND.TIMER"});
}

function ignoreUpdate() {
    emit({ event: "DURATION.UPDATE.IGNORE", namespace: "BACKGROUND.TIMER"});
}

function on(event, eventListener) {
    const unsubscribeFn = timerEventsListener.on(event, eventListener);
    return unsubscribeFn;
}

function all(eventListener) {
    const unsubscribeFn = timerEventsListener.all(eventListener);
    return unsubscribeFn;
}

export const timer = {
    all,
    destroy,
    getState,
    ignoreUpdate,
    isInitialized,
    on,
    pause,
    play,
    removeListeners: timerEventsListener.removeListeners,
    reset,
    saveUpdate,
    start,
};