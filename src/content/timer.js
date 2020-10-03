import { readable } from "svelte/store";
import { timer } from "../common/events";

function buildStoreData(phase) {
    const { initialized, value, context: { timerMachine } } = phase;
    return {
        initialized,
        phase: value,
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

        return function unsubscribe() {
            unsubscribeFns.forEach(fn => fn());
        };
    });
}