import { readable } from "svelte/store";
import { EventListener, timer } from "../common/events";

const backgroundListener = new EventListener("TIMER");

function getTimerDataFromState(state) {
    const { value: phase, event: { remaining }} = state;

    return { phase, remaining };
}

export default async function createTickListener() {
    const initialValue = await timer.getState();

    return readable(initialValue, (setReadableValue) => {
        const unsubscribe = backgroundListener.on("TICK", (state) => {
            setReadableValue(getTimerDataFromState(state));
        });
        return unsubscribe;
    });
}