import { assign, Machine, sendParent, send } from "xstate";

export function createTimerMachine(withContext = {}) {
    const timerMachine = Machine({
        initial: "running",
        context: {},
        states: {
            running: {
                entry: ["elapseSecond", "calculateRemaining", "sendParentTick"],
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
                        actions: ["elapseSecond", "calculateRemaining", "sendParentTick"],
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
            updating: {
                entry: [
                    assign({
                        stateBeforeUpdate: (context, _event, meta) => {
                            const previousState = meta.state.value;
                            if (context.stateBeforeUpdate) return context.stateBeforeUpdate;

                            return previousState;
                        },
                    }),
                    assign({
                        durationUpdate: (_context, event) => {
                            const { from, to } = event;
                            return { from, to };
                        },
                    }),
                ],
                on: {
                    "DURATION.UPDATE.SAVE": {
                        actions: [
                            assign({
                                duration: (context) => {
                                    return context.durationUpdate.to;
                                },
                            }),
                            send("RESUME"),
                        ],
                    },
                    "DURATION.UPDATE.IGNORE": {
                        actions: send("RESUME"),
                    },
                    RESUME: [
                        {
                            target: "paused",
                            cond: (context) => context.stateBeforeUpdate === "paused",
                        },
                        {
                            target: "completed",
                            cond: (context) => context.stateBeforeUpdate === "completed",
                        },
                        { target: "running" },
                    ],
                },
                exit: [
                    assign({
                        durationUpdate: () => null,
                    }),
                    assign({
                        stateBeforeUpdate: () => null,
                    }),
                ],
            },
            completed: {
                always: {
                    target: "running",
                    cond: context => context.elapsed < context.duration,
                },
                type: "final",
                onEntry: sendParent("DONE"),
            },
        },
        on: {
            "DURATION.UPDATE": "updating",
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
    },
    {
        actions: {
            elapseSecond: assign({
                elapsed: context => {
                    return isNaN(context.elapsed) ? 0 : context.elapsed + 1000/* one second */;
                },
            }),
            calculateRemaining: assign({
                remaining: context => context.duration - context.elapsed,
            }),
            sendParentTick: sendParent("TICK"),
        },
    });

    return timerMachine.withContext({
        ...timerMachine.context,
        ...withContext,
    });
}