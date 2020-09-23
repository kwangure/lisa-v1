import { emit, request } from "./emit.js";

async function getState() {
    return request({ namespace: "BACKGROUND.SETTINGS", query: "FETCH" });
}

async function reset() {
    emit({ event: "RESET", namespace: "BACKGROUND.SETTINGS" });
}

async function update(settings) {
    return emit({ namespace: "BACKGROUND.SETTINGS", event: "UPDATE", data: settings });
}

export const settings = {
    getState,
    reset,
    update,
};