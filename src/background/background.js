import createLisaMachine, { formatLisaData } from "./machines/lisa";
import { serializeState, stateOrChildStateChanged } from "./xstate.js";
import createSettings from "./settings";
import { interpret } from "xstate";
import { timer } from "../common/events";

const { settings, addListener: onSettingsChange } = createSettings();
const lisaMachine = createLisaMachine(settings);
const lisaService = interpret(lisaMachine);

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

onSettingsChange(() => {
    lisaService.send("SETTINGS.UPDATE");
});
