import {
    getAppearanceSettings,
    updateAppearanceSettings,
    updateSettings,
} from "./settings.js";
import { serializeState, stateOrChildStateChanged } from "./xstate.js";
import { settings, timer } from "../common/events";
import { createLisaService } from "./phase/phase";

const lisaService = createLisaService();

function formatLisaData(lisaMachineState) {
    const { value: status, event, children: lisaChildren } = lisaMachineState;

    const formatted = { status, event };

    if (status === "active") {
        const { phaseMachine } = lisaChildren;

        Object.assign(formatted, {
            phase: phaseMachine.value,
            ...phaseMachine.context,
        });

        const { timerMachine } = phaseMachine.children;
        Object.assign(formatted, {
            timer: {
                remaining: timerMachine.context.remaining,
                state: timerMachine.value,
                position: getAppearanceSettings().timerPosition,
            },
        });
    }

    return formatted;
}

// Forward background events to other extension scripts
lisaService.onTransition((state, event) => {
    if (stateOrChildStateChanged(state)) {
        state = serializeState(state);
        timer.emit({ event: event.type, payload: formatLisaData(state) });
    }
});

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

settings.on("UPDATE", updateSettings);
settings.on("UPDATE.APPEARANCE.POSITION", (value) => {
    const appearanceSettings = getAppearanceSettings();
    appearanceSettings.timerPosition = value;
    updateAppearanceSettings(appearanceSettings);

    // TODO: Do this better
    // Force client update
    timer.emit({
        event: "TICK",
        payload: formatLisaData(serializeState(lisaService.state)),
    });
});
