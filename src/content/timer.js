import { readable } from "svelte/store";
import { timer } from "../common/events";

export default function createTimerStore() {
    const defaultValue = { isInitialized: null, phase: null, remaining: 0 };

    return readable(defaultValue, async (setReadableValue) => {
        const unsubscribeFns = [];

        function queueUnsubscribe(unsubscribeFn) {
            unsubscribeFns.push(unsubscribeFn);
        }

        function handleState(pomodoro) {
            const phase = pomodoro.state;
            const { state, context: { remaining }} = pomodoro.context.timerMachine;
            setReadableValue({ isInitialized: true , phase, remaining, state });
        }

        if (!await timer.isInitialized()) {
            setReadableValue({ ...defaultValue, isInitialized: false });
            queueUnsubscribe(timer.on("xstate.init", handleState));
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