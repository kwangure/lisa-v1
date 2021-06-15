import { serializeState, stateOrChildStateChanged } from "./xstate.js";
import { settings as settingsEvents, timer } from "../common/events";
import { createLisaService } from "./phase";
import createSettings from "./settings";

const settings = createSettings();
const lisaService = createLisaService(settings);
// Forward background events to other extension scripts
lisaService.onTransition((state, event) => {
    if (stateOrChildStateChanged(state)) {
        const stateObj = serializeState(state);
        timer.emit({ event: event.type, payload: formatLisaData(stateObj) });
    }
});

// Forward events from other scripts to `lisaService`
timer.all((event, payload) => {
    if (lisaService.initialized) {
        lisaService.send(event, { value: payload });
    }
});

timer.on("FETCH", (_, respond) => {
    const state = serializeState(lisaService.state);

    respond(formatLisaData(state));
});

lisaService.start();

settingsEvents.on("UPDATE.APPEARANCE.POSITION", (value) => {
    settings.appearanceSettings.timerPosition = value;

    lisaService.send("SETTINGS.UPDATE");
});

function formatLisaData(lisaMachineState) {
    const { value: status, event, children } = lisaMachineState;
    const formatted = { status, event };

    if (status === "active") {
        const { phaseMachine } = children;

        Object.assign(formatted, {
            phase: phaseMachine.value,
            ...phaseMachine.context,
        });
    } else if (status === "disabled") {
        const { disabledMachine } = children;

        Object.assign(formatted, {
            disabled: disabledMachine.value,
            ...disabledMachine.context,
        });
    }

    return formatted;
}
