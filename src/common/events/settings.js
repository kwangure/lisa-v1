import { emit, request } from "./emit.js";
import { EventListener } from "./listen.js";

const settingsEventsListener = new EventListener("BACKGROUND.SETTINGS");

function getState() {
    return request({ namespace: "BACKGROUND.SETTINGS", query: "FETCH" });
}

function reset() {
    emit({ event: "RESET", namespace: "BACKGROUND.SETTINGS" });
}

function update(settings) {
    return emit({
        namespace: "BACKGROUND.SETTINGS",
        event: "UPDATE",
        payload: settings,
    });
}

function on(event, eventListener) {
    const unsubscribeFn = settingsEventsListener.on(event, eventListener);
    return unsubscribeFn;
}

function all(event, eventListener) {
    const unsubscribeFn = settingsEventsListener.all(event, eventListener);
    return unsubscribeFn;
}

export const settings = {
    all,
    getState,
    on,
    reset,
    update,
};
