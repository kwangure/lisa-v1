import chromePersistable from "../storage.js";
import clone from "just-clone";
import createDisabledMachine from "./disabled";
import createPhaseMachine from "./phase";
import { defaultSettings } from "~@common/settings";
import { forward } from "~@common/xstate.js";
import { assign, interpret, Machine } from "xstate";

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

export default function createLisaMachine() {
    let phase_service, disabled_service;
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
                            settings.update((s) => {
                                s.phaseSettings["disabled"].duration = event.value;
                                return s;
                            });
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
                            settings.update((s) => {
                                s.phaseSettings["disabled"].duration = event.value;
                                return s;
                            });
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
                    ], () => phase_service),
                },
                exit: "destroy_phase_service"
            },
            disabled: {
                entry: "create_disabled_service",
                on: {
                    "DISABLE.END": "active",
                    ...forward([
                        "DISABLE.START",
                    ], () => disabled_service),
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
            create_phase_service: () => {
                phase_service = createPhaseMachine(settings.get());
                phase_service.onTransition((state) => {
                    service.send("PHASE.UPDATE", {
                        payload: state.context,
                    });
                });
            },
            destroy_phase_service: () => {
                phase_service.stop();
                phase_service = null;
            },
            create_disabled_service: () => {
                disabled_service = createDisabledMachine(settings.get());
                disabled_service.onTransition((state) => {
                    service.send("PHASE.UPDATE", {
                        payload: state.context,
                    });
                });
            },
            destroy_disabled_service: () => {
                disabled_service.stop();
                disabled_service = null;
            },
        },
    });

    const service = interpret(machine);
    service.start();

    const default_state = { last_state: "setup", context: {}};
    const { lisaState, lisaStateReadStatus, lisaStateWriteStatus }
        = chromePersistable("lisaState", default_state);
    const { settings, settingsReadStatus, settingsWriteStatus }
        = chromePersistable("settings", clone(defaultSettings));

    onDone(lisaStateReadStatus, settingsReadStatus).then(() => {
        const state = lisaState.get();
        service.send("DONE", state);

        // Persist data after loading is done
        service.onTransition(({ value, context }) => {
            lisaState.set({ last_state: value, context });
        });
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

