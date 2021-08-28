import { assign, Machine, sendParent } from "xstate";
import createTimerMachine from "./timer";
import { forward } from "~@common/xstate.js";

function initialTimerData(settings, phase) {
    const { duration } = settings.phaseSettings[phase];

    return {
        duration,
        remaining: duration,
        elapsed: 0,
        extendedDuration: 0,
        state: "running",
    };
}

export default function createPhaseMachine(settings, saved_state) {
    const { phaseSettings } = settings;
    const longBreakInterval = phaseSettings.longBreak.interval;

    let initial_phase = "focus";
    let initial_timer_state = {};
    let initial_context = {
        focusPhasesSinceStart: 0,
        focusPhasesInCycle: 0,
        focusPhasesUntilLongBreak: longBreakInterval,
        completedPhase: {
            name: "",
            context: {},
        },
        currentPhase: "focus",
        nextPhase: "shortBreak",
        timerMachine: initialTimerData(settings, "focus"),
    };

    if (saved_state.status === "active") {
        initial_phase = saved_state.phase;
        initial_context = saved_state.context;
        initial_timer_state = saved_state.context.timerMachine;
    }

    function createPhase(phase) {
        return {
            [phase]: {
                invoke: {
                    id: "timerMachine",
                    src: createTimerMachine(phase, settings, initial_timer_state),
                    data: (context) => context.timerMachine,
                    onDone: {
                        target: "transition",
                        actions: [
                            assign({
                                completedPhase: (context) => ({
                                    name: phase,
                                    context,
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
                        "WARN_REMAINING.DISMISS",
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
                    extendedDuration,
                });
            },
        });
    }

    return Machine({
        initial: initial_phase,
        context: initial_context,
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
                    "DISABLE.START": {
                        actions: sendParent("DISABLE.START"),
                    },
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

}
