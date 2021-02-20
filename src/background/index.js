import { interpret, Interpreter } from "xstate";
import { settings, timer } from "../common/events";
import { createPhaseMachine } from "./phase/phase.js";
import settingsWritable from "./settings.js";

const phaseMachine = createPhaseMachine({
    settings: settingsWritable.value(),
});
function serializeState(state, initialized) {
    const context = {};
    for (const [key, value] of Object.entries(state.context)) {
        if (value instanceof Interpreter) {
            context[key] = serializeState(value.state, value.initialized);
        } else {
            context[key] = value;
        }
    }
    return {
        value: state.value,
        event: state.event.type,
        context: context,
        initialized: initialized,
        done: state.done,
    };
}

const pomodoroService = interpret(phaseMachine);
pomodoroService.onTransition((state) => {
    const {
        event, ...payload
    } = serializeState(state, pomodoroService.initialized);

    timer.emit({ event, payload });
});
timer.all((event, payload) => {
    if (pomodoroService.initialized) {
        pomodoroService.send(event, { value: payload });
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
settings.on("UPDATE", (settingsValue) => {
    settingsWritable.set(settingsValue);
    settings.emit({ event: "CHANGED", payload: settingsValue });
    if (pomodoroService.initialized) {
        pomodoroService.send("SETTINGS.UPDATE", { value: settingsValue });
    }
});
