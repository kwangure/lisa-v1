import { assign, Machine, send, sendParent } from "xstate";

export function createTimerMachine(withContext = {}) {
    const targetUpdating = [
        {
            target: "updating.duration",
            cond: (context) => Boolean(context.durationUpdate),
        },
        {
            target: "updating.position",
            cond: (context) => Boolean(context.positionUpdate),
        },
    ];

    const timerMachine = Machine(
        {
            initial: "running",
            context: {
                pausedDuration: 180_000,
                warnRemaining: 60_000,
            },
            states: {
                running: {
                    initial: "normal",
                    entry: [
                        "assignDefaults",
                        "elapseSecond",
                        "calculateRemaining",
                        "sendParentTick",
                    ],
                    invoke: {
                        id: "elapseSecond",
                        src: () => (sendParentEvent) => {
                            const id = setInterval(
                                () => sendParentEvent("TICK"),
                                1000,
                            );

                            return function cleanUp() {
                                clearInterval(id);
                            };
                        },
                    },
                    states: {
                        normal: {
                            always: [
                                {
                                    target: "warnRemaining",
                                    cond: (context) => {
                                        const {
                                            warnRemaining,
                                            remaining,
                                            warningDismissed,
                                        } = context;

                                        if (warningDismissed) return;

                                        return remaining < warnRemaining;
                                    },
                                },
                            ],
                        },
                        warnRemaining: {
                            entry: sendParent("WARN_REMAINING"),
                            on: {
                                "WARN_REMAINING.DISMISS": "normal",
                            },
                            exit: assign({
                                warningDismissed: true,
                            }),
                        },
                    },
                    always: [
                        ...targetUpdating,
                        {
                            target: "completed",
                            cond: (context) => context.remaining <= 0,
                        },
                    ],
                    on: {
                        TICK: {
                            actions: [
                                "elapseSecond",
                                "calculateRemaining",
                                "sendParentTick",
                            ],
                        },
                        PAUSE: "paused",
                    },
                },
                paused: {
                    entry: send("REMIND", {
                        delay: (context) => context.pausedDuration,
                    }),
                    always: targetUpdating,
                    on: {
                        COMPLETE: "completed",
                        PLAY: "running",
                        REMIND: "reminding",
                    },
                },
                reminding: {
                    always: targetUpdating,
                    on: {
                        COMPLETE: "completed",
                        PLAY: "running",
                        PAUSE: "paused",
                    },
                },
                updating: {
                    entry: assign({
                        stateBeforeUpdate: (context, _event, meta) => {
                            const previousState = meta.state.value;
                            if (context.stateBeforeUpdate) {
                                return context.stateBeforeUpdate;
                            }

                            return previousState;
                        },
                    }),
                    states: {
                        duration: {
                            on: {
                                "DURATION.UPDATE.SAVE": {
                                    actions: [
                                        assign({
                                            duration: (context) => (
                                                context.durationUpdate
                                            ),
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
                                            position: (context) => (
                                                context.positionUpdate
                                            ),
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
                                cond: (context) => (
                                    context.stateBeforeUpdate === "paused"
                                ),
                            },
                            {
                                target: "completed",
                                cond: (context) => (
                                    context.stateBeforeUpdate === "completed"
                                ),
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
                            cond: (context) => context.remaining > 0,
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
                            positionUpdate: (context, event) => {
                                if (context.position !== event.positionUpdate) {
                                    return event.positionUpdate;
                                }
                                return null;
                            },
                        }),
                        send("RESUME"),
                    ],
                },
                "DURATION.UPDATE": {
                    actions: [
                        assign({
                            durationUpdate: (context, event) => {
                                if (context.duration !== event.durationUpdate) {
                                    return event.durationUpdate;
                                }
                                return null;
                            },
                        }),
                        send("RESUME"),
                    ],
                },
                "RESET": {
                    actions: [
                        assign({
                            elapsed: 0,
                        }),
                        "calculateRemaining",
                    ],
                },
            },
        },
        {
            actions: {
                assignDefaults: assign({
                    elapsed: (context) => (
                        isNaN(context.elapsed) || context.elapsed < 0
                            ? 0
                            : context.elapsed
                    ),
                    extendedDuration: (context) => {
                        const { extendedDuration } = context;
                        return isNaN(extendedDuration) || extendedDuration < 0
                            ? 0
                            : extendedDuration;
                    },
                }),
                elapseSecond: assign({
                    elapsed: ({ elapsed, duration, extendedDuration }) => (
                        elapsed >= (duration + extendedDuration)
                            ? elapsed
                            : elapsed + 1000 /* one second */
                    ),
                }),
                calculateRemaining: assign({
                    remaining: (context) => {
                        const { duration, extendedDuration, elapsed } = context;
                        return (duration + extendedDuration) - elapsed;
                    },
                }),
                assignPausedDefault: assign({
                    elapsedWhilePaused: () => 0,
                }),
                elapsePausedSecond: assign({
                    elapsedWhilePaused: (context) => {
                        const { elapsedWhilePaused, pausedDuration } = context;
                        return elapsedWhilePaused >= pausedDuration
                            ? elapsedWhilePaused
                            : elapsedWhilePaused + 1000 /* one second */;
                    },
                }),
                calculatePausedRemaining: assign({
                    pausedRemaining: (context) => (
                        context.pausedDuration - context.elapsePausedSecond
                    ),
                }),
                sendParentTick: sendParent("TICK"),
            },
        }
    );

    return timerMachine.withContext({
        ...timerMachine.context,
        ...withContext,
    });
}
