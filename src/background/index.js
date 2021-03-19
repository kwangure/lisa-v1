import { serializeState, stateOrChildStateChanged } from "./xstate.js";
import { settings as settingsEvents, timer } from "../common/events";
import { createLisaService } from "./phase/phase";

createLisaService().then(([lisaService, settings]) => {
    // Forward background events to other extension scripts
    lisaService.onTransition((state, event) => {
        if (stateOrChildStateChanged(state)) {
            state = serializeState(state);
            timer.emit({ event: event.type, payload: formatLisaData(state) });
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

        // Force client update
        // TODO: Do this better
        timer.emit({
            event: "TICK",
            payload: formatLisaData(serializeState(lisaService.state)),
        });
    });

    function formatLisaData(lisaMachineState) {
        const {
            value: status,
            event,
            children: lisaChildren,
        } = lisaMachineState;

        const formatted = { status, event };

        if (status === "active") {
            const { phaseMachine } = lisaChildren;

            Object.assign(formatted, {
                phase: phaseMachine.value,
                ...phaseMachine.context,
            });


        } else if (status === "disabled") {
            const { disabledMachine } = lisaChildren;

            Object.assign(formatted, {
                disabled: disabledMachine.value,
            });

            if (disabledMachine.value === "default") {
                const { timerMachine } = disabledMachine.children;
                Object.assign(formatted, {
                    timerMachine: {
                        remaining: timerMachine.context.remaining,
                        state: timerMachine.value,
                    },
                });
            }
        }

        return formatted;
    }
});
