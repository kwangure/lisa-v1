import { emit, timer, settings } from "../common/events";
import { createPhaseMachine, createPomodoroService } from "./phase/phase.js";
import { Interpreter } from "xstate";
import settingsWritable from "./settings.js";

const phaseMachine = createPhaseMachine();
// TODO(kwangure): remember to `settingsWritable.cleanUp();` somewhere
phaseMachine.withContext({
    settings: settingsWritable.value(),
});

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

const pomodoroService = createPomodoroService(phaseMachine);
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