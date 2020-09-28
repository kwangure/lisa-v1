import { emit, timer, settings } from "../common/events";
import { createPhaseMachine } from "./phase/phase.js";
import { Interpreter, interpret } from "xstate";
import { reloadOnFileChange } from "./reload.js";
// TODO(kwangure): remember to `settingsWritable.cleanUp();` somewhere
import settingsWritable from "./settings.js";

if(import.meta.env.DEV) {
    reloadOnFileChange();
}

const phaseContext = {
    settings: settingsWritable.value(),
};
const phaseMachine = createPhaseMachine(phaseContext);

function serializeState(state) {
    const context = {};
    for (const [key, value] of Object.entries(state.context)) {
        if(value instanceof Interpreter) {
            context[key] = serializeState(value.state);
        } else {
            context[key] = value;
        }
    }
    return  {
        value: state.value,
        event: state.event.type,
        context,
        done: state.done,
    };
}

const pomodoroService = interpret(phaseMachine);
pomodoroService.onTransition((state) => {
    const { event, ...data } = serializeState(state);
    emit({ event, data, namespace: "BACKGROUND.TIMER" });
});
timer.all((event, data) => {
    pomodoroService.send(event, { value: data });
});
timer.on("IS_INITIALIZED", (_, respond) => {
    respond(pomodoroService.initialized);
});
timer.on("FETCH", (_, respond) => {
    respond(pomodoroService.state);
});
timer.on("START", () => {
    pomodoroService.start();
});

settings.on("FETCH", (_, respond) => {
    respond(settingsWritable.value());
});
settings.on("UPDATE", (data) => {
    settingsWritable.set(data);
    emit({ namespace: "BACKGROUND.SETTINGS", event: "CHANGED", data });
});