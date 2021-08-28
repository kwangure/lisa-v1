import { interpret, Machine } from "xstate";
import createDisabledMachine from "./disabled";
import createPhaseMachine from "./phase";
import { forward } from "~@common/xstate.js";

export default function createLisaMachine(settings, initial_state) {
    const machine = Machine({
        initial: initial_state.status,
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
                    src: createPhaseMachine(settings, initial_state),
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
                    src: createDisabledMachine(settings, initial_state),
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

    return interpret(machine).start();
}

export function formatLisaData(lisaMachineState) {
    const { value: status, event, children } = lisaMachineState;
    const formatted = { status, event };

    if (status === "active") {
        const { phaseMachine } = children;

        Object.assign(formatted, {
            phase: phaseMachine.value,
            done: phaseMachine.done,
            context: phaseMachine.context,
        });
    } else if (status === "disabled") {
        const { disabledMachine } = children;

        Object.assign(formatted, {
            disabled: disabledMachine.value,
            done: disabledMachine.done,
            context: disabledMachine.context,
        });
    }

    return formatted;
}

