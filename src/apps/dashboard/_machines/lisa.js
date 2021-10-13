import chromePersistable from "../storage.js";
import createDisabledMachine from "./disabled";
import createPhaseMachine from "./phase";
import { forward } from "~@common/xstate.js";
import { assign, interpret, Machine, State } from "xstate";

function onDone(...stores) {
    return Promise.all(stores.map((store) => new Promise((resolve) => {
        const unsubscribe = store.subscribe((status) => {
            if (status === "done") {
                unsubscribe();
                resolve();
            }
        })
    })));
}

export default function createLisaMachine(settings) {
    const machine = Machine({
        initial: "loading",
        context: {},
        states: {
            loading: {
                on: {
                    DONE: [
                        {
                            target: "active",
                            cond: (_, event) => event.last_state === "active",
                        },
                        {
                            target: "setup",
                        }
                    ],
                },
                exit: assign((_, event) => event.context),
            },
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
                entry: "create_phase_service",
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
                    ], "phase_service"),
                },
                exit: "destroy_phase_service"
            },
            disabled: {
                entry: "create_disabled_service",
                on: {
                    "DISABLE.END": "active",
                    ...forward([
                        "DISABLE.START",
                    ], "disabled_service"),
                },
                exit: "destroy_disabled_service",
            },
        },
        on: {
            "PHASE.UPDATE": {
                actions: assign({
                    phaseMachine: (context, event) => event.payload,
                }),
            },
        },
    }, {
        actions: {
            create_phase_service: assign({
                phase_service: () => {
                    const phase_service = createPhaseMachine(settings);
                    phase_service.onTransition((state) => {
                        service.send("PHASE.UPDATE", {
                            payload: state.context,
                        });
                    });

                    return phase_service;
                },

            }),
            destroy_phase_service: assign({
                phase_service: (context) => {
                    context.phase_service.stop();
                    return null;
                },
            }),
            create_disabled_service: assign({
                disabled_service: () => {
                    const disabled_machine = createDisabledMachine(settings)
                    const saved_state =
                        JSON.parse(localStorage.getItem("disabled-state"))
                        || disabled_machine.initialState;
                    const initial_state = State.create(saved_state);
                    const resolved_state = disabled_machine.resolveState(initial_state);
                    const disabled_service = interpret(disabled_machine)
                        .start(resolved_state);
                    service.send({
                        type: "PHASE.UPDATE",
                        payload: disabled_service.state.context,
                    });
                    disabled_service.onTransition((state) => {
                        localStorage.setItem("disabled-state", JSON.stringify(state));
                        service.send({
                            type: "PHASE.UPDATE",
                            payload: state.context,
                        });
                    });

                    return disabled_service;
                },
            }),
            destroy_disabled_service: assign({
                disabled_service: (context) => {
                    context.disabled_service.stop();
                    return null;
                },
            })
        }
    });

    const service = interpret(machine);
    service.start();

    const default_state = { last_state: "setup", context: {}};
    const { lisaState, lisaStateReadStatus, lisaStateWriteStatus }
        = chromePersistable("lisaState", default_state);

    onDone(lisaStateReadStatus).then(() => {
        const state = lisaState.get();
        service.send("DONE", state);

        // Persist data after loading is done
        // service.onTransition(({ value, context }) => {
        //     lisaState.set({ last_state: value, context });
        // });
    });

    return service;
}

export function formatLisaData(lisaMachineState) {
    const { value: status, event, context } = lisaMachineState;
    const formatted = { status, event };

    if (status === "active") {
        Object.assign(formatted, {
            phaseMachine: context.phaseMachine || {},
        });
    } else if (status === "disabled") {
        Object.assign(formatted, {
            disabledMachine: context.disabledMachine || {},
        });
    }

    return formatted;
}

