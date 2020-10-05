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
        initialized,
        phase: value,
        focusPhasesSinceStart,
        focusPhasesUntilLongBreak,
        nextPhase,
        previousPhase,
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
            const data = buildStoreData(phase);
            setReadableValue(data);
        }

        queueUnsubscribe(timer.on("SETTINGS.UPDATE", handleState));
        queueUnsubscribe(timer.on("DURATION.UPDATE.SAVE", handleState));
        queueUnsubscribe(timer.on("DURATION.UPDATE.IGNORE", handleState));
        queueUnsubscribe(timer.on("POSITION.UPDATE.SAVE", handleState));
        queueUnsubscribe(timer.on("POSITION.UPDATE.FORCE_SAVE", handleState));
        queueUnsubscribe(timer.on("POSITION.UPDATE.IGNORE", handleState));
        queueUnsubscribe(timer.on("DURATION.CHANGE", handleState));
        queueUnsubscribe(timer.on("PAUSE", handleState));
        queueUnsubscribe(timer.on("PLAY", handleState));
        queueUnsubscribe(timer.on("RESET", handleState));
        queueUnsubscribe(timer.on("TICK", handleState));
        queueUnsubscribe(timer.on("RESET", handleState));
        queueUnsubscribe(timer.on("IDLE", handleState));
        queueUnsubscribe(timer.on("NEXT", handleState));

        return function unsubscribe() {
            unsubscribeFns.forEach(fn => fn());
        };
    });
}