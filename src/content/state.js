import { assign, Machine, interpret } from "xstate";
import { createSettingsWritable } from "../common/store/settings";
import { derived, get } from "svelte/store";
import { millisecondsToHumanReadableTime } from "../utils/time";
import { timer } from "../common/events";
import initialized from "./initialized.svelte";
import update from "./update.svelte";
import updatePosition from "./updatePosition.svelte";
import uninitialized from "./uninitialized.svelte";
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
            settingStore: null,
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
                            src: () => Promise.all([createTimerStore(), createSettingsWritable()]),
                            onDone: [
                                {
                                    target: "loading",
                                    cond: context => (
                                        context.timerStore === null ||
                                        context.settingStore === null
                                    ),
                                },
                                {
                                    target: "updating",
                                    cond: (context) => {
                                        const { state } = get(context.timerStore);
                                        return state === "updating";
                                    },
                                },
                                { target: "running" },
                            ],
                        },
                        exit: [
                            assign({
                                timerStore: (_context, event) => {
                                    const [timerStore] = event.data;
                                    return timerStore;
                                },
                            }),
                            assign({
                                settingStore: (_context, event) => {
                                    const [,settingStore] = event.data;
                                    return settingStore;
                                },
                            }),
                        ],
                    },
                    running: {
                        id: "running",
                        entry: [
                            assign({
                                componentStore: (context) => {
                                    const { timerStore, settingStore } = context;
                                    return derived([timerStore, settingStore], ([timer, settings]) => {
                                        const { phase, remaining, state, position } = timer;
                                        const time = millisecondsToHumanReadableTime(remaining);

                                        return { phase, state, time, position };
                                    });
                                },
                            }),
                            createComponent(initialized),
                        ],
                        invoke: {
                            src: (context) => {
                                return function (sendParentEvent) {
                                    const { componentStore } = context;
                                    const unsubscribe = componentStore.subscribe(data => {
                                        const { state, ...componentData } = data;
                                        if (state.updating === "duration") {
                                            sendParentEvent("DURATION.UPDATE");
                                        } else if (state.updating === "position") {
                                            sendParentEvent("POSITION.UPDATE");
                                        } else{
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
                                            const { timerStore, settingStore } = context;
                                            return derived([timerStore, settingStore], ([timer, settings]) => {
                                                const { phase, duration, state } = timer;

                                                return {
                                                    state,
                                                    phase,
                                                    previousDuration: duration,
                                                    currentDuration: settings.phaseSettings[phase].duration,
                                                };
                                            });
                                        },
                                    }),
                                    createComponent(update),
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
                                            const { timerStore, settingStore } = context;
                                            return derived([timerStore, settingStore], ([timer, settings]) => {
                                                const { state, position } = timer;

                                                return {
                                                    state,
                                                    previousPosition: position,
                                                    currentPosition: settings.appearanceSettings.timerPosition,
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