import { emit, settings, timer } from "../common/events";
import { interpret, Interpreter } from "xstate";
import { createPhaseMachine } from "./phase/phase.js";
import settingsWritable from "./settings.js";

const phaseContext = {
    settings: settingsWritable.value(),
};
const phaseMachine = createPhaseMachine(phaseContext);

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
    emit({
        event: event,
        payload: payload,
        namespace: "BACKGROUND.TIMER",
    });
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
settings.on("UPDATE", (payload) => {
    settingsWritable.set(payload);
});
settingsWritable.subscribe((settings) => {
    emit({
        namespace: "BACKGROUND.SETTINGS",
        event: "CHANGED",
        payload: settings,
    });

    if (pomodoroService.initialized) {
        pomodoroService.send("SETTINGS.UPDATE", { value: settings });
    }
});
