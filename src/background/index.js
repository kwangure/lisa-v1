import { emit, timer, settings } from "../common/events";
import { createPhaseMachine } from "./phase/phase.js";
import { Interpreter, interpret } from "xstate";
import settingsWritable from "./settings.js";

const phaseContext = {
    settings: settingsWritable.value().phaseSettings,
};
const phaseMachine = createPhaseMachine(phaseContext);

function serializeState(state, initialized) {
    const context = {};
    for (const [key, value] of Object.entries(state.context)) {
        if(value instanceof Interpreter) {
            context[key] = serializeState(value.state, value.initialized);
        } else {
            context[key] = value;
        }
    }
    return  {
        value: state.value,
        event: state.event.type,
        context,
        initialized,
        done: state.done,
    };
}

const pomodoroService = interpret(phaseMachine);
pomodoroService.onTransition((state) => {
    const { event, ...data } = serializeState(state, pomodoroService.initialized);
    emit({ event, data, namespace: "BACKGROUND.TIMER" });
});
timer.all((event, data) => {
    if(pomodoroService.initialized) {
        pomodoroService.send(event, { value: data });
    }
});
timer.on("IS_INITIALIZED", (_, respond) => {
    respond(pomodoroService.initialized);
});
timer.on("FETCH", (_, respond) => {
    respond(serializeState(pomodoroService.state));
});
timer.on("START", () => {
    pomodoroService.start();
});

settings.on("FETCH", (_, respond) => {
    respond(settingsWritable.value());
});
settings.on("UPDATE", (data) => {
    settingsWritable.set(data);
});
settingsWritable.subscribe((settings) => {
    emit({ namespace: "BACKGROUND.SETTINGS", event: "CHANGED", data: settings });
});