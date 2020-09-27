import { readable } from "svelte/store";
import { timer } from "../common/events";

export default function createTimerStore() {
    const defaultValue = { isInitialized: null, phase: null, remaining: 0 };

    return readable(defaultValue, async (setReadableValue) => {
        function handleState(pomodoro) {
            const phase = pomodoro.state;
            const { state, context: { remaining }} = pomodoro.context.timerMachine;
            setReadableValue({ isInitialized: true , phase, remaining, state });
        }

        const unsubscribeTick = timer.on("TICK", handleState);
        if (!await timer.isInitialized()) {
            setReadableValue({ ...defaultValue, isInitialized: false });
            const unsubscribeInit = timer.on("xstate.init", (state) => {
                handleState(state);
            });
            return function unsubscribe() {
                unsubscribeTick();
                unsubscribeInit();
            };
        }

        return unsubscribeTick;
    });
}