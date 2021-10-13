import { assign, interpret, Machine, sendParent, State } from "xstate";
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

export default function createPhaseMachine(settings) {
    const { phaseSettings } = settings;
    const longBreakInterval = phaseSettings.longBreak.interval;

    function createPhase(phase) {
        return {
            [phase]: {
                entry: "create_timer_service",
                on: {
                    "DISABLE": "disabling",
                    "PAUSE.REMIND": {
                        actions: sendParent("PAUSE.REMIND"),
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
                    ], "timer_service"),
                },
                exit: "destroy_timer_service"
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

    const default_context = {
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
    const context = JSON.parse(localStorage.getItem("phase-state")) || default_context;
    const machine = Machine({
        initial: context.currentPhase,
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
        on: {
            "TIMER.UPDATE": {
                actions: assign({
                    timerMachine: (_, event) => {
                        console.log("updating timerMachine", { event })
                        return event.payload
                    }
                    ,
                }),
            },
        },
    }, {
        actions: {
            create_timer_service: assign({
                timer_service: (context, event) => {
                    const { currentPhase, timerMachine } = context;
                    const timer_service = createTimerMachine(currentPhase, settings, timerMachine)
                    timer_service.onTransition(async (state) => {
                        if (state.event.type === "xstate.init") return;
                        console.log("transitioning timer machine", { state, service });
                        service.send("TIMER.UPDATE", {
                            payload: state.context,
                        });
                    });

                    return timer_service;
                },
            }),
            destroy_timer_service: assign({
                timer_service: (context) => {
                    context.timer_service.stop();
                    return null;
                },
            })
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

    const service = interpret(machine.withContext(context)).start();
    service.onTransition((state) => {
        localStorage.setItem("phase-state", JSON.stringify(state.context));
    });

    return service;
}
