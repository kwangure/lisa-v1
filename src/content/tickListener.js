import { readable } from "svelte/store";
import { EventListener, request } from "../common/events";

const backgroundListener = new EventListener("TIMER");

async function getPomodoroState() {
    return request({ namespace: "BACKGROUND.TIMER", query: "DATA" });
}

function getPomodoroDataFromState(state) {
    const { value: phase, event: { remaining }} = state;

    return { phase, remaining };
}

export default async function createTickListener() {
    const initialValue = await getPomodoroState();

    return readable(initialValue, (setReadableValue) => {
        const unsubscribe = backgroundListener.on("TICK", (state) => {
            setReadableValue(getPomodoroDataFromState(state));
        });
        return unsubscribe;
    });
}