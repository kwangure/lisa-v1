import { assign, Machine, interpret } from "xstate";
import { createSettingsWritable } from "../common/store/settings";
import { derived } from "svelte/store";
import { millisecondsToHumanReadableTime } from "../utils/time";
import { timer } from "../common/events";
import initialized from "./initialized.svelte";
import uninitialized from "./uninitialized.svelte";
import createTimerStore from "./timer.js";

export function createTimerMachine(options) {
    const { target = document.body } = options;
    const timerMachine = Machine({
        id: "timer",
        initial: "loading",
        context: {
            timerStore: null,
            initializedComponent: null,
            uninitializedComponent: null,
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
                entry: assign({
                    initializedComponent: () => {
                        return new initialized({ target });
                    },
                }),
                initial: "loading",
                states: {
                    loading: {
                        invoke: {
                            src: () => Promise.all([createTimerStore(), createSettingsWritable()]),
                            onDone: "running",
                        },
                    },
                    running: {
                        invoke: {
                            src: (_context, event) => {
                                return function (sendParentEvent) {
                                    const [timerStore, settingStore] = event.data;
                                    const componentStore =
                                        derived([timerStore, settingStore], ([timer, settings]) => {
                                            const { phase, remaining, state } = timer;
                                            const time = millisecondsToHumanReadableTime(remaining);
                                            const { appearanceSettings: { timerPosition } } = settings;

                                            return { phase, state, time, timerPosition };
                                        });
                                    componentStore.subscribe(data => {
                                        sendParentEvent({ type: "COMPONENT.UPDATE", data });
                                    });
                                };
                            },
                        },
                        on: {
                            "COMPONENT.UPDATE": {
                                actions: (context, event) => {
                                    context.initializedComponent.$set(event.data);
                                },
                            },
                        },
                    },
                },
                exit: (context) => {
                    context.initializedComponent.$destroy();
                },
            },
            uninitialized: {
                entry: assign({
                    uninitializedComponent: () => {
                        return new uninitialized({ target });
                    },
                }),
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
                exit: (context) => {
                    context.uninitializedComponent.$destroy();
                },
            },
        },
    });

    return interpret(timerMachine);
}