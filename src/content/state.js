import { assign, Machine, interpret } from "xstate";
import { derived, get } from "svelte/store";
import { millisecondsToHumanReadableTime } from "../utils/time";
import { timer } from "../common/events";
import running from "./timer/running.svelte";
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
                                        const time = millisecondsToHumanReadableTime(remaining);

                                        return { phase, state, time, position };
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
                                        const { state: { updating } } = data;
                                        if (updating === "duration") {
                                            sendParentEvent("DURATION.UPDATE");
                                        } else if (updating === "position") {
                                            sendParentEvent("POSITION.UPDATE");
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