import { readable } from "svelte/store";
import { timer } from "../common/events";

function buildStoreData(phase) {
    const { initialized, value, context } = phase;
    const {
        focusPhasesSinceStart,
        focusPhasesUntilLongBreak,
        nextPhase,
        previousPhase,
        timerMachine,
    } = context;

    return {
        initialized: initialized,
        phase: value,
        focusPhasesUntilLongBreak: focusPhasesUntilLongBreak,
        focusPhasesSinceStart: focusPhasesSinceStart,
        nextPhase: nextPhase,
        previousPhase: previousPhase,
        ...timerMachine.context,
        state: timerMachine.value,
    };
}
export default async function createTimerStore() {
    const initialState = buildStoreData(await timer.getState());

    return readable(initialState, (setReadableValue) => {
        const unsubscribeFns = [];

        function queueUnsubscribe(unsubscribeFn) {
            unsubscribeFns.push(unsubscribeFn);
        }

        function handleState(phase) {
            const value = buildStoreData(phase);
            setReadableValue(value);
        }

        queueUnsubscribe(timer.on("xstate.update", handleState));

        return function unsubscribe() {
            unsubscribeFns.forEach((fn) => fn());
        };
    });
}
