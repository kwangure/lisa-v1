import { assign, interpret, Machine, sendParent } from "xstate";
import createSettings from "../settings.js";
import { forward } from "../../common/xstate.js";

function createTimerMachine(phase, settings) {
    const timerMachine = Machine({
        initial: "running",
        states: {
            running: {
                invoke: {
                    src: () => (sendParentEvent) => {
                        const id = setInterval(() => sendParentEvent("TICK"), 1000);

                        return () => clearInterval(id);
                    },
                },
                on: {
                    TICK: {
                        actions: [
                            "elapseSecond",
                            "calculateRemaining",
                            "sendParentTick",
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
                initial: "default",
                states: {
                    default: {
                        entry: assign({
                            pauseDuration: settings.phaseSettings[phase].pauseDuration,
                        }),
                        after: {
                            PAUSE_DELAY: {
                                target: "reminding",
                                actions: sendParent("PAUSE.REMIND"),
                            },
                        },
                    },
                    reminding: {
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
                always: [
                    { target: "running", cond: "isRunning" },
                ],
                type: "final",
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
            sendParentTick: sendParent("TICK"),
        },
        guards: {
            isCompleted: (context) => context.remaining <= 0,
            isRunning: (context) => context.remaining > 0,
            isNotDisabled: () => phase !== "disabled",
        },
        delays: {
            PAUSE_DELAY: () => settings.phaseSettings[phase].pauseDuration,
        },
    });

    return timerMachine;
}

function createPhaseMachine(settings) {
    const { phaseSettings } = settings;
    const longBreakInterval = phaseSettings.longBreak.interval;

    function createPhase(phase) {
        return {
            [phase]: {
                invoke: {
                    id: "timerMachine",
                    src: createTimerMachine(phase, settings),
                    // `data` here is xState's API
                    // eslint-disable-next-line id-denylist
                    data: (_, event) => {
                        const { duration } = settings.phaseSettings[phase];

                        let remaining, elapsed, extendedDuration;
                        if (event.type === "EXTEND") {
                            extendedDuration = event.value;
                            remaining = event.value;
                            elapsed = duration;
                        } else {
                            extendedDuration = 0;
                            remaining = duration;
                            elapsed = 0;
                        }

                        return { duration, remaining, elapsed, extendedDuration };
                    },
                    onDone: {
                        target: "transition",
                        actions: [
                            assign({
                                completedPhase: (context) => ({
                                    name: phase,
                                    context: context,
                                }),
                            }),
                            assign({
                                focusPhasesSinceStart: (context) => {
                                    const { focusPhasesSinceStart = 0, completedPhase } = context;
                                    const { name, context: { wasExtended }} = completedPhase;

                                    return (name === "focus" && !wasExtended)
                                        ? focusPhasesSinceStart + 1
                                        : focusPhasesSinceStart;
                                },
                            }),
                            assign({
                                focusPhasesInCycle: (context) => {
                                    const { focusPhasesInCycle = 0, completedPhase } = context;
                                    const { name, context: { wasExtended }} = completedPhase;

                                    if (name === "longBreak") return 0;
                                    if (name !== "focus" || wasExtended) return focusPhasesInCycle;

                                    return focusPhasesInCycle + 1;
                                },
                            }),
                            assign({
                                focusPhasesUntilLongBreak: (context) => {
                                    const { focusPhasesInCycle } = context;

                                    return longBreakInterval
                                        - ((focusPhasesInCycle - 1) % longBreakInterval)
                                        - 1;
                                },
                            }),
                            assign({
                                nextPhase: (context) => {
                                    const { focusPhasesUntilLongBreak } = context;

                                    switch (phase) {
                                        case "shortBreak":
                                        case "longBreak":
                                            return "focus";
                                        default:
                                    }

                                    if (longBreakInterval <= 0) {
                                        return "shortBreak";
                                    }

                                    if (focusPhasesUntilLongBreak === 0) {
                                        return "longBreak";
                                    } else {
                                        return "shortBreak";
                                    }
                                },
                            }),
                            sendParent("DONE"),
                        ],
                    },
                },
                on: {
                    "PAUSE.REMIND": {
                        actions: sendParent("PAUSE.REMIND"),
                    },
                    "TICK": {
                        actions: sendParent("TICK"),
                    },
                    ...forward([
                        "PAUSE",
                        "PAUSE.DEFAULT",
                        "PLAY",
                    ], "timerMachine"),
                },
            },
        };
    }

    const phaseMachine = Machine({
        initial: "focus",
        context: {
            focusPhasesSinceStart: 0,
            focusPhasesInCycle: 0,
            focusPhasesUntilLongBreak: longBreakInterval,
            nextPhase: "shortBreak",
        },
        states: {
            ...createPhase("focus"),
            ...createPhase("shortBreak"),
            ...createPhase("longBreak"),
            transition: {
                on: {
                    NEXT: [
                        { target: "focus", cond: "focusIsNext" },
                        { target: "shortBreak", cond: "shortBreakIsNext" },
                        { target: "longBreak", cond: "longBreakIsNext" },
                    ],
                    EXTEND: [
                        { target: "focus", cond: "isFromFocus" },
                        { target: "shortBreak", cond: "isFromShortBreak" },
                        { target: "longBreak", cond: "isFromLongBreak" },
                    ],
                },
            },
        },
    }, {
        guards: {
            focusIsNext: (context) => context.nextPhase === "focus",
            shortBreakIsNext: (context) => context.nextPhase === "shortBreak",
            longBreakIsNext: (context) => context.nextPhase === "longBreak",

            isFromFocus: (context) => context.completedPhase.name === "focus",
            isFromShortBreak: (context) => context.completedPhase.name === "shortBreak",
            isFromLongBreak: (context) => context.completedPhase.name === "longBreak",
        },
    });

    return phaseMachine;
}

function createDisabledMachine(settings) {
    const disabledMachine = Machine({
        initial: "setup",
        states: {
            setup: {
                on: {
                    "DISABLE.START": {
                        target: "default",
                        actions: (_, event) => {
                            settings.phaseSettings["disabled"].duration = event.value;
                        },
                    },
                },
            },
            default: {
                invoke: {
                    id: "timerMachine",
                    src: createTimerMachine("disabled", settings),
                    // `data` here is xState's API
                    // eslint-disable-next-line id-denylist
                    data: () => {
                        const { duration } = settings.phaseSettings["disabled"];

                        return {
                            remaining: duration,
                            elapsed: 0,
                            extendedDuration: 0,
                        };
                    },
                    onDone: {
                        target: "transition",
                        actions: [
                            sendParent("DONE"),
                        ],
                    },
                },
                on: {
                    TICK: {
                        actions: sendParent("TICK"),
                    },
                },
            },
            transition: {
                on: {
                    "DISABLE.END": sendParent("DISABLE.END"),
                    "DISABLE.START": {
                        target: "default",
                        actions: (_, event) => {
                            settings.phaseSettings["disabled"].duration = event.value;
                        },
                    },
                },
            },
        },
    });
    return disabledMachine;
}

export async function createLisaService() {
    const settings = await createSettings();
    const lisaMachine = Machine({
        initial: "setup",
        states: {
            setup: {
                on: {
                    DISABLE: "disabled",
                    START: "active",
                },
            },
            active: {
                invoke: {
                    id: "phaseMachine",
                    src: createPhaseMachine(settings),
                },
                on: {
                    DISABLE: "disabled",
                    ...forward([
                        "EXTEND",
                        "NEXT",
                        "PAUSE",
                        "PAUSE.DEFAULT",
                        "PLAY",
                    ], "phaseMachine"),
                },
            },
            disabled: {
                invoke: {
                    id: "disabledMachine",
                    src: createDisabledMachine(settings),
                },
                on: {
                    "DISABLE.END": "active",
                    ...forward([
                        "DISABLE.START",
                    ], "disabledMachine"),
                },
            },
        },
    });

    const lisaService = interpret(lisaMachine);

    return [lisaService, settings];
}
