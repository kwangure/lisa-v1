import { assign, Machine, sendParent } from "xstate";

export function createPhaseMachine() {
    return Machine({
        initial: "running",
        context: {
            duration: 0,
            elapsed: 0,
        },
        states: {
            running: {
                invoke: {
                    id: "elapseSecond",
                    src: () => {
                        return function  callbackHandler(callback) {
                            const id = setInterval(() => callback("TICK"), 1000);

                            return function cleanUp() {
                                clearInterval(id);
                            };
                        };
                    },
                },
                always: {
                    target: "completed",
                    cond: context => context.elapsed >= context.duration,
                },
                on: {
                    TICK: {
                        actions: [
                            assign({
                                elapsed: context => {
                                    return isNaN(context.elapsed) ? 0 : context.elapsed + 1000/* one second */;
                                },
                            }),
                            sendParent((context) => ({
                                type: "TICK",
                                remaining: context.duration - context.elapsed,
                            })),
                        ],
                    },
                    PAUSE: "paused",
                },
            },
            paused: {
                on: {
                    COMPLETE: "completed",
                    PLAY: "running",
                },
            },
            completed: {
                always: {
                    target: "running",
                    cond: context => context.elapsed < context.duration,
                },
                type: "final",
            },
        },
        on: {
            "DURATION.EXTEND": {
                actions: assign({
                    duration: (context, event) => {
                        console.log("extending duration", { context, event });
                        return context.duration + event.value;
                    },
                }),
            },
            RESET: {
                actions: assign({
                    elapsed: 0,
                }),
            },
        },
    });
}