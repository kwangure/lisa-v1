import { assign, Machine, forwardTo, interpret, spawn } from "xstate";
import { createPhaseMachine } from "./phaseStates.js";
import { defaultSettings } from "../settings.js";

export function createPomodoroMachine() {
    const focusPhaseId = "focus";
    const shortBreakPhaseId = "shortBreak";
    const longBreakPhaseId = "longBreak";

    const eventsToForwardTo = (child) => {
        return {
            PAUSE: {
                actions: forwardTo(child),
            },
            PLAY: {
                actions: forwardTo(child),
            },
            COMPLETE: {
                actions: forwardTo(child),
            },
            RESET: {
                actions: forwardTo(child),
            },
        };
    };

    const pomodoroMachine = Machine({
        id: "pomodoro",
        initial: "focus",
        context: {
            settings: defaultSettings,
            nextPhase: "shortBreak",
            remaining: 0,
            timerMachine: null,
        },
        states: {
            focus: {
                entry: assign({
                    timerMachine: ({ settings }) => {
                        const timerMachine = createPhaseMachine(settings.focus.duration);
                        return spawn(timerMachine, { sync: true });
                    },
                }),
                on: {
                    DONE: [{
                        target: "shortBreak",
                        cond: (context) => context.nextPhase === "shortBreak",
                    },
                    {
                        target: "longBreak",
                    }],
                    ...eventsToForwardTo(focusPhaseId),
                },
            },
            shortBreak: {
                entry: assign({
                    timerMachine: ({ settings }) => {
                        const timerMachine = createPhaseMachine(settings.shortBreak.duration);
                        return spawn(timerMachine, { sync: true });
                    },
                }),
                on: {
                    DONE: "focus",
                    ...eventsToForwardTo(shortBreakPhaseId),
                },
            },
            longBreak: {
                entry: assign({
                    timerMachine: ({ settings }) => {
                        const timerMachine = createPhaseMachine(settings.longBreak.duration);
                        return spawn(timerMachine, { sync: true });
                    },
                }),
                on: {
                    DONE: "focus",
                    ...eventsToForwardTo(longBreakPhaseId),
                },
            },
        },
    });

    return pomodoroMachine;
}

export function createPomodoroService(pomodoroMachine) {
    const pomodoroService = interpret(pomodoroMachine);
    return pomodoroService;
}