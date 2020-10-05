import { emit, request } from "./emit.js";
import { EventListener } from "./listen.js";
import { timerPositions } from "../store/settings/default";

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

async function extendPrevious(duration) {
    emit({ event: "EXTEND", namespace: "BACKGROUND.TIMER", data: duration });
}

async function nextPhase() {
    emit({ event: "NEXT", namespace: "BACKGROUND.TIMER" });
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

function isRightPosition(position) {
    return timerPositions.BOTTOM_RIGHT.value === position;
}

function positionLeft() {
    emit({
        event: "POSITION.UPDATE.FORCE_SAVE",
        namespace: "BACKGROUND.TIMER",
        data: {
            position: timerPositions.BOTTOM_LEFT.value,
        },
    });
}

function positionRight() {
    emit({
        event: "POSITION.UPDATE.FORCE_SAVE",
        namespace: "BACKGROUND.TIMER",
        data: {
            position: timerPositions.BOTTOM_RIGHT.value,
        },
    });
}

function savePositionUpdate() {
    emit({ event: "POSITION.UPDATE.SAVE", namespace: "BACKGROUND.TIMER"});
}

function ignorePositionUpdate() {
    emit({ event: "POSITION.UPDATE.IGNORE", namespace: "BACKGROUND.TIMER"});
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
    extendPrevious,
    getState,
    ignoreUpdate,
    ignorePositionUpdate,
    isInitialized,
    isRightPosition,
    nextPhase,
    on,
    pause,
    play,
    positionLeft,
    positionRight,
    removeListeners: timerEventsListener.removeListeners,
    reset,
    saveUpdate,
    savePositionUpdate,
    start,
};