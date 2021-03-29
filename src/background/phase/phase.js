import { assign, interpret, Machine, sendParent } from "xstate";
import createSettings from "../settings.js";
import { forward } from "../../common/xstate.js";

function createTimerMachine(phase, settings) {
    const timerMachine = Machine({
        initial: "running",
        states: {
            running: {
                entry: [
                    assign({ state: "running" }),
                    "sendParentUpdate",
                ],
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
                            "updateTimerPosition",
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
                initial: "default",
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
                    "updateTimerPosition",
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
            updateTimerPosition: assign({
                position: () => settings.appearanceSettings.timerPosition,
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
        },
        delays: {
            PAUSE_DELAY: () => settings.phaseSettings[phase].pauseDuration,
        },
    });

    return timerMachine;
}

function initialTimerData(settings, phase) {
    const { duration } = settings.phaseSettings[phase];
    const { timerPosition } = settings.appearanceSettings;

    return {
        duration: duration,
        remaining: duration,
        position: timerPosition,
        elapsed: 0,
        extendedDuration: 0,
        state: "running",
    };
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
                    data: (context) => context.timerMachine,
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
                                    const { currentPhase, focusPhasesUntilLongBreak } = context;

                                    switch (currentPhase) {
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
                    "DISABLE": "disabling",
                    "PAUSE.REMIND": {
                        actions: sendParent("PAUSE.REMIND"),
                    },
                    "TIMER.UPDATE": {
                        actions: [
                            "updateTimerData",
                            sendParent("TIMER.UPDATE"),
                        ],
                    },
                    "RESTART": {
                        target: "focus",
                        actions: assign({
                            focusPhasesInCycle: 0,
                            timerMachine: initialTimerData(settings, "focus"),
                        }),
                    },
                    ...forward([
                        "PAUSE",
                        "PAUSE.DEFAULT",
                        "PLAY",
                        "RESET",
                        "SETTINGS.UPDATE",
                    ], "timerMachine"),
                },
            },
        };
    }

    function setupNextTimerData(phase) {
        return assign({
            currentPhase: phase,
            timerMachine: initialTimerData(settings, phase),
        });
    }

    function setupExtendedTimerData(phase) {
        return assign({
            timerMachine: (_, event) => {
                const defaultData = initialTimerData(settings, phase);
                const extendedDuration = event.value;

                return Object.assign(defaultData, {
                    remaining: extendedDuration,
                    elapsed: defaultData.duration,
                    extendedDuration: extendedDuration,
                });
            },
        });
    }

    const phaseMachine = Machine({
        initial: "focus",
        context: {
            focusPhasesSinceStart: 0,
            focusPhasesInCycle: 0,
            focusPhasesUntilLongBreak: longBreakInterval,
            currentPhase: "focus",
            nextPhase: "shortBreak",
            timerMachine: initialTimerData(settings, "focus"),
        },
        states: {
            ...createPhase("focus"),
            ...createPhase("shortBreak"),
            ...createPhase("longBreak"),
            transition: {
                on: {
                    NEXT: [
                        {
                            target: "focus",
                            cond: "focusIsNext",
                            actions: setupNextTimerData("focus"),
                        },
                        {
                            target: "shortBreak",
                            cond: "shortBreakIsNext",
                            actions: setupNextTimerData("shortBreak"),
                        },
                        {
                            target: "longBreak",
                            cond: "longBreakIsNext",
                            actions: setupNextTimerData("longBreak"),
                        },
                    ],
                    EXTEND: [
                        {
                            target: "focus",
                            cond: "isFromFocus",
                            actions: setupExtendedTimerData("focus"),
                        },
                        {
                            target: "shortBreak",
                            cond: "isFromShortBreak",
                            actions: setupExtendedTimerData("shortBreak"),
                        },
                        {
                            target: "longBreak",
                            cond: "isFromLongBreak",
                            actions: setupExtendedTimerData("longBreak"),
                        },
                    ],
                },
            },
            disabling: {
                on: {
                    "DISABLE.START": sendParent("DISABLE.START"),
                    "DISABLE.CANCEL": [
                        { target: "focus", cond: "focusIsCurrent" },
                        { target: "shortBreak", cond: "shortBreakIscurrent" },
                        { target: "longBreak", cond: "longBreakIscurrent" },
                    ],
                },
            },
        },
    }, {
        actions: {
            updateTimerData: assign({
                timerMachine: (_, event) => event.payload,
            }),
        },
        guards: {
            focusIsCurrent: (context) => context.currentPhase === "focus",
            shortBreakIsCurrent: (context) => context.currentPhase === "shortBreak",
            longBreakIsCurrent: (context) => context.currentPhase === "longBreak",

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
        initial: "default",
        context: {},
        states: {
            default: {
                invoke: {
                    id: "timerMachine",
                    src: createTimerMachine("disabled", settings),
                    data: () => initialTimerData(settings, "disabled"),
                    onDone: {
                        target: "transition",
                        actions: [
                            sendParent("DONE"),
                        ],
                    },
                },
                on: {
                    "TIMER.UPDATE": {
                        actions: [
                            "updateTimerData",
                            sendParent("TIMER.UPDATE"),
                        ],
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
    }, {
        actions: {
            updateTimerData: assign({
                timerMachine: (_, event) => event.payload,
            }),
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
                    "DISABLE": "disabled",
                    "DISABLE.START": {
                        target: "disabled",
                        actions: (_, event) => {
                            settings.phaseSettings["disabled"].duration = event.value;
                        },
                    },
                    "START": "active",
                },
            },
            active: {
                invoke: {
                    id: "phaseMachine",
                    src: createPhaseMachine(settings),
                },
                on: {
                    "DISABLE.START": {
                        target: "disabled",
                        actions: (_, event) => {
                            settings.phaseSettings["disabled"].duration = event.value;
                        },
                    },
                    ...forward([
                        "DISABLE",
                        "DISABLE.CANCEL",
                        "EXTEND",
                        "NEXT",
                        "PAUSE",
                        "PAUSE.DEFAULT",
                        "PLAY",
                        "RESET",
                        "RESTART",
                        "SETTINGS.UPDATE",
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
