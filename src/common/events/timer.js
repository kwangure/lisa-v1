import { emit, request } from "./emit.js";
import { EventListener } from "./listen.js";
import { timerPositions } from "../store/settings/default";

const timerEventsListener = new EventListener("BACKGROUND.TIMER");
const { removeListeners } = timerEventsListener;

function getState() {
    return request({ namespace: "BACKGROUND.TIMER", query: "FETCH" });
}

function isInitialized() {
    return request({ namespace: "BACKGROUND.TIMER", query: "IS_INITIALIZED" });
}

function start() {
    return request({ namespace: "BACKGROUND.TIMER", query: "START" });
}

function pause() {
    emit({ event: "PAUSE", namespace: "BACKGROUND.TIMER" });
}

function play() {
    emit({ event: "PLAY", namespace: "BACKGROUND.TIMER" });
}

function reset() {
    emit({ event: "RESET", namespace: "BACKGROUND.TIMER" });
}

function restart() {
    emit({ event: "RESTART", namespace: "BACKGROUND.TIMER" });
}

function extendPrevious(duration) {
    emit({ event: "EXTEND", namespace: "BACKGROUND.TIMER", payload: duration });
}

function nextPhase() {
    emit({ event: "NEXT", namespace: "BACKGROUND.TIMER" });
}

function destroy() {
    emit({ event: "DESTROY", namespace: "BACKGROUND.TIMER" });
}

function saveUpdate() {
    emit({ event: "DURATION.UPDATE.SAVE", namespace: "BACKGROUND.TIMER" });
}

function ignoreUpdate() {
    emit({ event: "DURATION.UPDATE.IGNORE", namespace: "BACKGROUND.TIMER" });
}

function isRightPosition(position) {
    return timerPositions.BOTTOM_RIGHT.value === position;
}

function positionLeft() {
    emit({
        event: "POSITION.UPDATE.FORCE_SAVE",
        namespace: "BACKGROUND.TIMER",
        payload: {
            position: timerPositions.BOTTOM_LEFT.value,
        },
    });
}

function positionRight() {
    emit({
        event: "POSITION.UPDATE.FORCE_SAVE",
        namespace: "BACKGROUND.TIMER",
        payload: {
            position: timerPositions.BOTTOM_RIGHT.value,
        },
    });
}

function savePositionUpdate() {
    emit({ event: "POSITION.UPDATE.SAVE", namespace: "BACKGROUND.TIMER" });
}

function ignorePositionUpdate() {
    emit({ event: "POSITION.UPDATE.IGNORE", namespace: "BACKGROUND.TIMER" });
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
    removeListeners,
    reset,
    restart,
    saveUpdate,
    savePositionUpdate,
    start,
};
