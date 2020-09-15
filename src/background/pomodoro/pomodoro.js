import { assign, Machine, forwardTo, interpret } from "xstate";
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
        },
        states: {
            focus: {
                invoke: {
                    id: focusPhaseId,
                    src: createPhaseMachine(),
                    data: {
                        duration: (context) => context.settings.focus.duration,
                    },
                    onDone: [
                        {
                            target: "shortBreak",
                            cond: (context) => context.nextPhase === "shortBreak",
                        },
                    ],
                },
                on: {
                    TICK: {
                        actions: assign({
                            remaining: (_, event) => event.remaining,
                        }),
                    },
                    ...eventsToForwardTo(focusPhaseId),
                },
            },
            shortBreak: {
                invoke: {
                    id: shortBreakPhaseId,
                    src: createPhaseMachine(),
                    data: {
                        duration: (context) => context.settings.shortBreak.duration,
                    },
                    onDone: "focus",
                },
                on: {
                    ...eventsToForwardTo(shortBreakPhaseId),
                },
            },
            longBreak: {
                invoke: {
                    id: longBreakPhaseId,
                    src: createPhaseMachine(),
                    data: {
                        duration: (context) => context.settings.longBreak.duration,
                    },
                    onDone: "focus",
                },
                on: {
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