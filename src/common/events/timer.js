import { emit, request } from "./emit.js";

async function getState() {
    return request({ namespace: "BACKGROUND.TIMER", query: "DATA" });
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

export const timer = {
    getState,
    pause,
    play,
    reset,
};