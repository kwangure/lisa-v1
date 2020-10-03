import { assign, Machine, interpret } from "xstate";
import { createSettingsWritable } from "../common/store/settings";
import { derived, get } from "svelte/store";
import { millisecondsToHumanReadableTime } from "../utils/time";
import { timer } from "../common/events";
import initialized from "./initialized.svelte";
import update from "./update.svelte";
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
                        entry: [
                            assign({
                                componentStore: (context) => {
                                    const { timerStore, settingStore } = context;
                                    return derived([timerStore, settingStore], ([timer, settings]) => {
                                        const { phase, remaining, state } = timer;
                                        const time = millisecondsToHumanReadableTime(remaining);
                                        const { appearanceSettings: { timerPosition } } = settings;

                                        return { phase, state, time, timerPosition };
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
                                        if (data.state === "updating") {
                                            sendParentEvent("TIMER.UPDATE");
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
                            "TIMER.UPDATE": "updating",
                        },
                    },
                    updating: {
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
                                        if (data.state !== "updating") {
                                            sendParentEvent("TIMER.UPDATED");
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
                            "TIMER.UPDATED": "running",
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