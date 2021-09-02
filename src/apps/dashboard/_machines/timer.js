import { assign, Machine, sendParent } from "xstate";

export default function createTimerMachine(phase, settings, saved_state) {
    let initial_state = "running";
    let initial_substate = "default";
    if (saved_state?.state) {
        if (saved_state.state.paused) {
            initial_state = "paused";
            initial_substate = saved_state.state.paused;
        } else if (saved_state.state.running) {
            initial_state = "running"
            initial_substate = saved_state.state.running;
        }
    }

    return Machine({
        initial: initial_state,
        states: {
            running: {
                initial: initial_state === "running"
                    ? initial_substate
                    : "default",
                invoke: {
                    src: () => (sendParentEvent) => {
                        const id = setInterval(() => {
                            sendParentEvent("TICK");
                        }, 1000);

                        return () => clearInterval(id);
                    },
                },
                states: {
                    default: {
                        entry: assign({
                            state: { running: "default" },
                        }),
                        always: {
                            target: "warnRemaining",
                            cond: "shouldWarn",
                        },
                    },
                    warnRemaining: {
                        entry: assign({
                            state: { running: "warnRemaining" },
                        }),
                        on: {
                            "WARN_REMAINING.DISMISS": "default",
                        },
                        exit: [
                            assign({
                                warnDismissed: true,
                            }),
                            "sendParentUpdate",
                        ],
                    },
                },
                on: {
                    TICK: {
                        actions: [
                            "elapseSecond",
                            "calculateRemaining",
                            "sendParentUpdate",
                        ],
                    },
                    PAUSE: {
                        target: "paused",
                        cond: "isNotDisabled",
                    },
                    COMPLETE: "completed",
                },
                always: [
                    { target: "completed", cond: "isCompleted" },
                ],
            },
            paused: {
                initial: initial_state === "paused"
                    ? initial_substate
                    : "default",
                states: {
                    default: {
                        entry: [
                            assign({
                                pauseDuration: settings.phaseSettings[phase].pauseDuration,
                                state: { paused: "default" },
                            }),
                            "sendParentUpdate",
                        ],
                        after: {
                            PAUSE_DELAY: {
                                target: "reminding",
                                actions: sendParent("PAUSE.REMIND"),
                            },
                        },
                    },
                    reminding: {
                        entry: [
                            assign({
                                state: { paused: "reminding" },
                            }),
                            "sendParentUpdate",
                        ],
                        on: {
                            "PAUSE.DEFAULT": "default",
                        },
                    },
                },
                on: {
                    COMPLETE: "completed",
                    PLAY: "running",
                },
                exit: assign({
                    pauseDuration: undefined,
                }),
            },
            completed: {
                entry: [
                    assign({
                        state: "completed",
                    }),
                    "sendParentUpdate",
                ],
                always: [
                    { target: "running", cond: "isRunning" },
                ],
                type: "final",
            },
        },
        on: {
            "RESET": {
                actions: [
                    assign({
                        elapsed: 0,
                        extendedDuration: 0,
                        wasExtended: false,
                    }),
                    "calculateRemaining",
                ],
            },
            "SETTINGS.UPDATE": {
                actions: [
                    "calculateRemaining",
                    "sendParentUpdate",
                ],
            },
        },
    }, {
        actions: {
            elapseSecond: assign({
                elapsed: (context) => {
                    const { duration } = settings.phaseSettings[phase];
                    const { elapsed, extendedDuration } = context;
                    return elapsed >= (duration + extendedDuration)
                        ? elapsed
                        : elapsed + 1000 /* one second */;
                },
            }),
            calculateRemaining: assign({
                remaining: (context) => {
                    const { duration } = settings.phaseSettings[phase];
                    const { extendedDuration, elapsed } = context;
                    return (duration + extendedDuration) - elapsed;
                },
            }),
            sendParentUpdate: sendParent((context) => ({
                type: "TIMER.UPDATE",
                payload: context,
            })),
        },
        guards: {
            isCompleted: (context) => context.remaining <= 0,
            isRunning: (context) => context.remaining > 0,
            isNotDisabled: () => phase !== "disabled",
            shouldWarn: (context) => {
                const { remaining, warnDismissed } = context;
                return remaining <= settings.phaseSettings[phase].warnRemaining && !warnDismissed;
            },
        },
        delays: {
            PAUSE_DELAY: () => settings.phaseSettings[phase].pauseDuration,
        },
    });
}
