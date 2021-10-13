import { assign, interpret, Machine, State } from "xstate";

export default function createTimerMachine(phase, settings, context) {
    const initial = context.state.paused ? "paused" : "running";
    const machine = Machine({
        initial,
        states: {
            running: {
                initial: "default",
                states: {
                    default: {
                        entry: assign({
                            state: { running: "default" },
                        }),
                        always: {
                            target: "warnRemaining",
                            cond: "shouldWarn",
                        },
                        after: {
                            1000: {
                                target: "default",
                                actions: [
                                    "elapseSecond",
                                    "calculateRemaining",
                                ]
                            }
                        },
                    },
                    warnRemaining: {
                        entry: assign({
                            state: { running: "warnRemaining" },
                        }),
                        after: {
                            1000: {
                                target: "warnRemaining",
                                actions: [
                                    "elapseSecond",
                                    "calculateRemaining",
                                ]
                            }
                        },
                        on: {
                            "WARN_REMAINING.DISMISS": "default",
                        },
                        exit: [
                            assign({
                                warnDismissed: true,
                            }),
                        ],
                    },
                },
                on: {
                    PAUSE: {
                        target: "paused",
                        cond: "isNotDisabled",
                    },
                    COMPLETE: "completed",
                },
                always: [
                    { target: "paused", cond: "isPaused" },
                    { target: "completed", cond: "isCompleted" },
                ],
            },
            paused: {
                initial: "default",
                states: {
                    default: {
                        entry: [
                            assign({
                                pauseDuration: settings.phaseSettings[phase].pauseDuration,
                                state: { paused: "default" },
                            }),
                        ],
                        after: {
                            PAUSE_DELAY: {
                                target: "reminding",
                            },
                        },
                    },
                    reminding: {
                        entry: [
                            assign({
                                state: { paused: "reminding" },
                            }),
                        ],
                        on: {
                            "PAUSE.DEFAULT": "default",
                        },
                    },
                },
                always: [
                    { target: "running", cond: "isRunning" },
                    { target: "completed", cond: "isCompleted" },
                ],
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
                ],
                always: [
                    { target: "running", cond: "isRunning" },
                    { target: "paused", cond: "isPaused" },
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
        },
        guards: {
            isCompleted: (context) => context.remaining <= 0,
            isRunning: (context) => context.remaining > 0 && context.state.running,
            isPaused: (context) => context.remaining > 0 && context.state.paused,
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

    context = JSON.parse(localStorage.getItem("timer-state")) || context;
    const service = interpret(machine.withContext(context)).start();
    service.onTransition((state) => {
        localStorage.setItem("timer-state", JSON.stringify(state.context));
    });

    return service;
}
