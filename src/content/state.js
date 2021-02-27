/* eslint max-len: off */
import { assign, interpret, Machine } from "xstate";
import { derived, get } from "svelte/store";
import createTimerStore from "./timer.js";
import nextPhase from "./dialogs/nextPhase.svelte";
import reminding from "./dialogs/reminding.svelte";
import running from "./timer/running.svelte";
import { timer } from "../common/events";
import uninitialized from "./dialogs/uninitialized.svelte";
import updateDuration from "./dialogs/updateDuration.svelte";
import updatePosition from "./dialogs/updatePosition.svelte";

export function createTimerMachine(options) {
    const { target = document.body } = options;

    // TODO: https://github.com/sveltejs/svelte/issues/537#issuecomment-298230658
    function createComponent(component) {
        return assign({
            component: (context) => {
                context?.component?.$destroy?.();
                const componentData = context.componentStore
                    ? get(context.componentStore)
                    : {};
                return new component({
                    target: target,
                    props: componentData,
                });
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
                        {
                            target: "initialized",
                            cond: (_, event) => event.data,
                        },
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
                                    cond: (context) => (
                                        Boolean(context.timerStore)
                                    ),
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
                                        const {
                                            phase, remaining, state, position,
                                        } = timer;

                                        return {
                                            phase, state, remaining, position,
                                        };
                                    });
                                },
                            }),
                            createComponent(running),
                        ],
                        invoke: {
                            src: (context) => (sendParentEvent) => {
                                const { componentStore } = context;
                                const unsubscribe
                                = componentStore.subscribe((value) => {
                                    const { state, phase } = value;

                                    if (state.updating === "duration") {
                                        sendParentEvent("DURATION.UPDATE");
                                    } else if (state.updating === "position") {
                                        sendParentEvent("POSITION.UPDATE");
                                    } else if (state.paused === "reminding") {
                                        sendParentEvent("PAUSE.REMIND");
                                    } else if (phase === "idle") {
                                        sendParentEvent("IDLE");
                                    } else {
                                        sendParentEvent({
                                            type: "COMPONENT.UPDATE",
                                            value: value,
                                        });
                                    }
                                });
                                return unsubscribe;
                            },
                        },
                        on: {
                            "COMPONENT.UPDATE": {
                                actions: (context, event) => {
                                    context.component.$set(event.value);
                                },
                            },
                            "DURATION.UPDATE": "updating.duration",
                            "POSITION.UPDATE": "updating.position",
                            "IDLE": "idle",
                            "PAUSE.REMIND": "reminding",
                        },
                    },
                    reminding: {
                        id: "reminding",
                        entry: [
                            assign({
                                componentStore: ({ timerStore }) => (
                                    derived(timerStore, ($timerStore) => {
                                        const { phase, pauseDuration } = $timerStore;
                                        return { phase, pauseDuration };
                                    })
                                ),
                            }),
                            createComponent(reminding),
                        ],
                        invoke: {
                            src: (context) => (sendParentEvent) => {
                                const { timerStore } = context;
                                const unsubscribe
                                = timerStore.subscribe((timer) => {
                                    if (timer.state.paused !== "reminding") {
                                        sendParentEvent("RESUME");
                                    }
                                });
                                return unsubscribe;
                            },
                        },
                        on: {
                            RESUME: "#running",
                        },
                    },
                    updating: {
                        states: {
                            duration: {
                                entry: [
                                    assign({
                                        componentStore: (context) => {
                                            const { timerStore } = context;
                                            // eslint-disable-next-line max-len
                                            return derived(timerStore, (timer) => ({
                                                phase: timer.phase,
                                                previousDuration: timer.duration,
                                                currentDuration: timer.durationUpdate,
                                            }));
                                        },
                                    }),
                                    createComponent(updateDuration),
                                ],
                                invoke: {
                                    src: (context) => (sendParentEvent) => {
                                        const { componentStore, timerStore } = context;
                                        const unsubscribe = timerStore.subscribe((value) => {
                                            const { state } = value;
                                            if (!state.updating) {
                                                sendParentEvent("DURATION.UPDATED");
                                            } else if (state.updating === "position") {
                                                sendParentEvent("POSITION.UPDATE");
                                            } else {
                                                sendParentEvent({
                                                    type: "COMPONENT.UPDATE",
                                                    value: get(componentStore),
                                                });
                                            }
                                        });
                                        return unsubscribe;
                                    },
                                },
                                on: {
                                    "COMPONENT.UPDATE": {
                                        actions: (context, event) => {
                                            context.component.$set(event.value);
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
                                                    state: state,
                                                    previousPosition: position,
                                                    currentPosition: positionUpdate,
                                                };
                                            });
                                        },
                                    }),
                                    createComponent(updatePosition),
                                ],
                                invoke: {
                                    src: (context) => (sendParentEvent) => {
                                        const { componentStore } = context;
                                        const unsubscribe = componentStore.subscribe((value) => {
                                            const { state, ...componentData } = value;
                                            if (!state.updating) {
                                                sendParentEvent("POSITION.UPDATED");
                                            } else if (state.updating === "duration") {
                                                sendParentEvent("DURATION.UPDATE");
                                            } else {
                                                sendParentEvent({
                                                    type: "COMPONENT.UPDATE",
                                                    value: componentData,
                                                });
                                            }
                                        });
                                        return unsubscribe;
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
                                            focusPhasesUntilLongBreak,
                                            focusPhasesSinceStart,
                                            previousPhase,
                                            nextPhase,
                                        } = timer;

                                        return {
                                            focusPhasesUntilLongBreak,
                                            focusPhasesSinceStart,
                                            previousPhase,
                                            nextPhase,
                                        };
                                    });
                                },
                            }),
                            createComponent(nextPhase),
                        ],
                        invoke: {
                            src: (context) => (sendParentEvent) => {
                                const { timerStore } = context;
                                const unsubscribe = timerStore.subscribe((timer) => {

                                    if (timer.state.running) {
                                        sendParentEvent("TIMER.RESUMED");
                                    }

                                });
                                return unsubscribe;
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
                    src: () => new Promise((resolve) => {
                        const unsubscribe = timer.on("xstate.init", () => {
                            unsubscribe();
                            resolve();
                        });
                    }),
                    onDone: "initialized",
                },
            },
        },
    });

    return interpret(timerMachine);
}
