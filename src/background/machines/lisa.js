import createDisabledMachine from "./disabled";
import createPhaseMachine from "./phase";
import { forward } from "~@common/xstate.js";
import { Machine } from "xstate";

export default function createLisaMachine(settings) {
    return Machine({
        initial: "setup",
        states: {
            setup: {
                on: {
                    "DISABLE": "disabled",
                    "DISABLE.START": {
                        target: "disabled",
                        actions: (_, event) => {
                            settings.phaseSettings["disabled"].duration = event.value;
                        },
                    },
                    "START": "active",
                },
            },
            active: {
                invoke: {
                    id: "phaseMachine",
                    src: createPhaseMachine(settings),
                },
                on: {
                    "DISABLE.START": {
                        target: "disabled",
                        actions: (_, event) => {
                            settings.phaseSettings["disabled"].duration = event.value;
                        },
                    },
                    ...forward([
                        "DISABLE",
                        "DISABLE.CANCEL",
                        "EXTEND",
                        "NEXT",
                        "PAUSE",
                        "PAUSE.DEFAULT",
                        "PLAY",
                        "RESET",
                        "RESTART",
                        "SETTINGS.UPDATE",
                        "WARN_REMAINING.DISMISS",
                    ], "phaseMachine"),
                },
            },
            disabled: {
                invoke: {
                    id: "disabledMachine",
                    src: createDisabledMachine(settings),
                },
                on: {
                    "DISABLE.END": "active",
                    ...forward([
                        "DISABLE.START",
                    ], "disabledMachine"),
                },
            },
        },
    });

}

export function formatLisaData(lisaMachineState) {
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

