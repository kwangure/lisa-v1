import { assign, Machine, sendParent, send } from "xstate";

export function createTimerMachine(withContext = {}) {
    const targetUpdating = [
        {
            target: "updating.duration",
            cond: (context) => !!context.durationUpdate,
        },
        {
            target: "updating.position",
            cond: (context) => !!context.positionUpdate,
        },
    ];

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
                always: [
                    ...targetUpdating,
                    {
                        target: "completed",
                        cond: context => context.elapsed >= context.duration,
                    },
                ],
                on: {
                    TICK: {
                        actions: ["elapseSecond", "calculateRemaining", "sendParentTick"],
                    },
                    PAUSE: "paused",
                },
            },
            paused: {
                always: targetUpdating,
                on: {
                    COMPLETE: "completed",
                    PLAY: "running",
                },
            },
            updating: {
                entry: assign({
                    stateBeforeUpdate: (context, _event, meta) => {
                        const previousState = meta.state.value;
                        if (context.stateBeforeUpdate) return context.stateBeforeUpdate;

                        return previousState;
                    },
                }),
                states: {
                    duration: {
                        on: {
                            "DURATION.UPDATE.SAVE": {
                                actions: [
                                    assign({
                                        duration: (context) => context.durationUpdate,
                                    }),
                                    assign({ durationUpdate: () => null }),
                                    send("RESUME"),
                                ],
                            },
                            "DURATION.UPDATE.IGNORE": {
                                actions: [
                                    assign({ durationUpdate: () => null }),
                                    send("RESUME"),
                                ],
                            },
                        },
                    },
                    position: {
                        on: {
                            "POSITION.UPDATE.SAVE": {
                                actions: [
                                    assign({
                                        position: (context) => {
                                            return context.positionUpdate;
                                        },
                                    }),
                                    assign({ positionUpdate: () => null }),
                                    send("RESUME"),
                                ],
                            },
                            "POSITION.UPDATE.IGNORE": {
                                actions: [
                                    assign({ positionUpdate: () => null }),
                                    send("RESUME"),
                                ],
                            },
                        },
                    },
                },
                on: {
                    RESUME: [
                        ...targetUpdating,
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
                exit: assign({
                    stateBeforeUpdate: () => null,
                }),
            },
            completed: {
                always: [
                    ...targetUpdating,
                    {
                        target: "running",
                        cond: context => context.elapsed < context.duration,
                    },
                ],
                type: "final",
                onEntry: sendParent("DONE"),
            },
        },
        on: {
            "POSITION.UPDATE": {
                actions: [
                    assign({
                        positionUpdate: (context, event) =>  {
                            if(context.position !== event.positionUpdate) {
                                return event.positionUpdate;
                            }
                            return null;
                        },
                    }),
                    send("RESUME"),
                ],
            },
            "DURATION.UPDATE": {
                actions:  [
                    assign({
                        durationUpdate: (context, event) =>  {
                            if(context.duration !== event.durationUpdate) {
                                return event.durationUpdate;
                            }
                            return null;
                        } ,
                    }),
                    send("RESUME"),
                ],
            },
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