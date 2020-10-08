import { assign, Machine, interpret } from "xstate";
import { derived, get } from "svelte/store";
import { timer } from "../common/events";
import reminding from "./dialogs/reminding.svelte";
import running from "./timer/running.svelte";
import nextPhase from "./dialogs/nextPhase.svelte";
import updateDuration from "./dialogs/updateDuration.svelte";
import updatePosition from "./dialogs/updatePosition.svelte";
import uninitialized from "./timer/uninitialized.svelte";
import createTimerStore from "./timer.js";

export function createTimerMachine(options) {
    const { target = document.body } = options;

    function createComponent(component) {
        return assign({
            component: (context) => {
                context?.component?.$destroy?.();
                const componentData = context.componentStore 
                    ? get(context.componentStore)
                    : {};
                return new component({ target, props: componentData });
            },
        });
    }

    const timerMachine = Machine({
        id: "timer",
        initial: "loading",
        context: {
            component: null,
            componentStore: null,
            timerStore: null,
        },
        states: {
            loading: {
                invoke: {
                    id: "loading",
                    src: () => timer.isInitialized(),
                    onDone: [
                        { target: "initialized", cond: (_, { data: isIntialized }) => isIntialized },
                        { target: "uninitialized" },
                    ],
                },
            },
            initialized: {
                initial: "loading",
                states: {
                    loading: {
                        invoke: {
                            src: () => createTimerStore(),
                            onDone: [
                                {
                                    target: "loading",
                                    cond: (context) => !!context.timerStore
                                },
                                {
                                    target: "updating",
                                    cond: (context) => {
                                        const { timerStore } = context;
                                        if (timerStore) {
                                            const { state } = get(timerStore);
                                            return state === "updating";
                                        }
                                    },
                                },
                                { target: "running" },
                            ],
                        },
                        exit: assign({
                            timerStore: (_context, event) => event.data,
                        }),
                    },
                    running: {
                        id: "running",
                        entry: [
                            assign({
                                componentStore: (context) => {
                                    const { timerStore } = context;
                                    return derived(timerStore, (timer) => {
                                        const { phase, remaining, state, position } = timer;

                                        return { phase, state, remaining, position };
                                    });
                                },
                            }),
                            createComponent(running),
                        ],
                        invoke: {
                            src: (context) => {
                                return function (sendParentEvent) {
                                    const { componentStore } = context;
                                    const unsubscribe = componentStore.subscribe(data => {
                                        const { state, phase } = data;

                                        if (state.updating === "duration") {
                                            sendParentEvent("DURATION.UPDATE");
                                        } else if (state.updating === "position") {
                                            sendParentEvent("POSITION.UPDATE");
                                        } else if (state === "reminding") {
                                            sendParentEvent("REMIND");
                                        } else if (phase === "idle") {
                                            sendParentEvent("IDLE");
                                        } else {
                                            sendParentEvent({ type: "COMPONENT.UPDATE", data });
                                        }
                                    });
                                    return unsubscribe;
                                };
                            },
                        },
                        on: {
                            "COMPONENT.UPDATE": {
                                actions: (context, event) => {
                                    context.component.$set(event.data);
                                },
                            },
                            "DURATION.UPDATE": "updating.duration",
                            "POSITION.UPDATE": "updating.position",
                            "IDLE": "idle",
                            "REMIND": "reminding",
                        },
                    },
                    reminding: {
                        id: "reminding",
                        entry: [
                            assign({
                                componentStore: ({ timerStore }) => {
                                    return derived(timerStore, ({ phase }) => ({ phase }));
                                },
                            }),
                            createComponent(reminding),
                        ],
                        invoke: {
                            src: (context) => {
                                return function (sendParentEvent) {
                                    const { timerStore } = context;
                                    const unsubscribe = timerStore.subscribe((timer) => {
                                        if (timer.state !== "reminding") {
                                            sendParentEvent("RESUME");
                                        }
                                    });
                                    return unsubscribe;
                                };
                            },
                        },
                        on: {
                            "RESUME": "#running",
                        },
                    },
                    updating: {
                        states: {
                            duration: {
                                entry: [
                                    assign({
                                        componentStore: (context) => {
                                            const { timerStore } = context;
                                            return derived(timerStore, (timer) => {
                                                const { phase, duration, durationUpdate, state } = timer;

                                                return {
                                                    state,
                                                    phase,
                                                    previousDuration: duration,
                                                    currentDuration: durationUpdate,
                                                };
                                            });
                                        },
                                    }),
                                    createComponent(updateDuration),
                                ],
                                invoke: {
                                    src: (context) => {
                                        return function (sendParentEvent) {
                                            const { componentStore } = context;
                                            const unsubscribe = componentStore.subscribe(data => {
                                                const { state, ...componentData } = data;
                                                if (!state.updating) {
                                                    sendParentEvent("DURATION.UPDATED");
                                                } else if (state.updating === "position") {
                                                    sendParentEvent("POSITION.UPDATE");
                                                } else {
                                                    sendParentEvent({ type: "COMPONENT.UPDATE", data: componentData });
                                                }
                                            });
                                            return unsubscribe;
                                        };
                                    },
                                },
                                on: {
                                    "COMPONENT.UPDATE": {
                                        actions: (context, event) => {
                                            context.component.$set(event.data);
                                        },
                                    },
                                    "DURATION.UPDATED": "#running",
                                    "POSITION.UPDATE": "position",
                                },
                            },
                            position: {
                                entry: [
                                    assign({
                                        componentStore: (context) => {
                                            const { timerStore } = context;
                                            return derived(timerStore, (timer) => {
                                                const { state, position, positionUpdate } = timer;

                                                return {
                                                    state,
                                                    previousPosition: position,
                                                    currentPosition: positionUpdate,
                                                };
                                            });
                                        },
                                    }),
                                    createComponent(updatePosition),
                                ],
                                invoke: {
                                    src: (context) => {
                                        return function (sendParentEvent) {
                                            const { componentStore } = context;
                                            const unsubscribe = componentStore.subscribe(data => {
                                                const { state, ...componentData } = data;
                                                if (!state.updating) {
                                                    sendParentEvent("POSITION.UPDATED");
                                                } else if (state.updating === "duration") {
                                                    sendParentEvent("DURATION.UPDATE");
                                                }else {
                                                    sendParentEvent({ type: "COMPONENT.UPDATE", data: componentData });
                                                }
                                            });
                                            return unsubscribe;
                                        };
                                    },
                                },
                                on: {
                                    "COMPONENT.UPDATE": {
                                        actions: (context, event) => {
                                            context.component.$set(event.data);
                                        },
                                    },
                                    "POSITION.UPDATED": "#running",
                                    "DURATION.UPDATE": "duration",
                                },
                            },
                        },
                    },
                    idle: {
                        entry: [
                            assign({
                                componentStore: (context) => {
                                    const { timerStore } = context;
                                    return derived(timerStore, (timer) => {
                                        const { 
                                            focusPhasesSinceStart, 
                                            focusPhasesUntilLongBreak,
                                            previousPhase,
                                            nextPhase,
                                        } = timer;

                                        return { 
                                            focusPhasesSinceStart,
                                            focusPhasesUntilLongBreak,
                                            previousPhase,
                                            nextPhase,
                                         };
                                    });
                                },
                            }),
                            createComponent(nextPhase)
                        ],
                        invoke: {
                            src: (context) => {
                                return function (sendParentEvent) {
                                    const { timerStore } = context;
                                    const unsubscribe = timerStore.subscribe(timer => {
                                        
                                        if (timer.state === "running") {
                                            sendParentEvent("TIMER.RESUMED");
                                        }
                                        
                                    });
                                    return unsubscribe;
                                };
                            },
                        },
                        on: {
                            "TIMER.RESUMED": "#running",
                        },
                    },
                },
            },
            uninitialized: {
                entry: createComponent(uninitialized),
                invoke: {
                    src: () => {
                        return new Promise(resolve => {
                            const unsubscribe = timer.on("xstate.init", () => {
                                unsubscribe();
                                resolve();
                            });
                        });
                    },
                    onDone: "initialized",
                },
            },
        },
    });

    return interpret(timerMachine);
}