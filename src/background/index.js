import { interpret, Interpreter } from "xstate";
import { settings, timer } from "../common/events";
import { createPhaseMachine } from "./phase/phase.js";
import settingsWritable from "./settings.js";

const phaseMachine = createPhaseMachine({
    settings: settingsWritable.value(),
});
function serializeState(state) {
    const context = {};
    for (const [key, value] of Object.entries(state.context)) {
        if (value instanceof Interpreter) {
            context[key] = serializeState(value.state);
        } else {
            context[key] = value;
        }
    }
    return {
        value: state.value,
        event: state.event.type,
        context: context,
        done: state.done,
    };
}
function formatPhaseMachineState(state) {
    const { context, value } = state;
    const {
        focusPhasesSinceStart,
        focusPhasesUntilLongBreak,
        nextPhase,
        previousPhase,
        timerMachine,
    } = context;

    return {
        name: value,
        next: nextPhase,
        previous: previousPhase,

        focusPhasesUntilLongBreak: focusPhasesUntilLongBreak,
        focusPhasesSinceStart: focusPhasesSinceStart,

        timer: {
            state: timerMachine.value,
            ...timerMachine.context,
        },
    };
}

const pomodoroService = interpret(phaseMachine);
pomodoroService.onTransition((state) => {
    const { event, ...payload } = serializeState(state);
    timer.emit({ event: event, payload: formatPhaseMachineState(payload) });
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
    const state = serializeState(pomodoroService.state);
    respond(formatPhaseMachineState(state));
});
timer.on("START", (_, respond) => {
    const state = serializeState(pomodoroService.start().state);
    respond(formatPhaseMachineState(state));
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
