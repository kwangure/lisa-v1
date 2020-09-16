import { emit, request } from "./emit.js";

async function getState() {
    return request({ namespace: "BACKGROUND.SETTINGS", query: "DATA" });
}

async function reset() {
    emit({ event: "RESET", namespace: "BACKGROUND.SETTINGS" });
}

export const settings = {
    getState,
    reset,
};