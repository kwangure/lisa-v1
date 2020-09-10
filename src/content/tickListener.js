import { readable } from "svelte/store";
import BackgroundListener from "./backgroundListener.js";

const backgroundListener = new BackgroundListener();

async function getFirstTick() {
    return new Promise(resolve => {
        const unsubscribe = backgroundListener.on("TICK", (state) => {
            unsubscribe();
            resolve(getPomodoroDataFromState(state));
        });
    });
}

function getPomodoroDataFromState(state) {
    const { value: phase, event: { remaining }} = state;

    return { phase, remaining };
}

export default async function createTickListener() {
    const initialValue = await getFirstTick();

    return readable(initialValue, (setReadableValue) => {
        const unsubscribe = backgroundListener.on("TICK", (state) => {
            setReadableValue(getPomodoroDataFromState(state));
        });
        return unsubscribe;
    });
}