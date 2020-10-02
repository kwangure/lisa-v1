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
    const isInitialized = await timer.isInitialized();
    const initialState = isInitialized
        ? buildStoreData(await timer.getState())
        : { initialized: false };

    return readable(initialState, (setReadableValue) => {
        const unsubscribeFns = [];

        function queueUnsubscribe(unsubscribeFn) {
            unsubscribeFns.push(unsubscribeFn);
        }

        function handleState(phase) {
            const data = buildStoreData(phase);
            setReadableValue(data);
        }

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