import { createMachine, interpret } from "xstate";
import { createPhaseRunnerMachine } from "./phaseStates.js";
import { defaultSettings } from "../settings.js";

export function createPomodoroMachine() {
    const focusPhaseRunner = createPhaseRunnerMachine("focus");
    const shortBreakPhaseRunner = createPhaseRunnerMachine("shortBreak");
    const longBreakPhaseRunner = createPhaseRunnerMachine("longBreak");

    const pomodoroMachine = createMachine({
        id: "pomodoro",
        initial: "focus",
        context: {
            settings: defaultSettings,
            nextPhase: "shortBreak",
        },
        states: {
            focus: {
                invoke: {
                    src: focusPhaseRunner,
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
            },
            shortBreak: {
                invoke: {
                    src: shortBreakPhaseRunner,
                    data: {
                        duration: (context) => context.settings.shortBreak.duration,
                    },
                    onDone: "focus",
                },
            },
            longBreak: {
                invoke: {
                    src: longBreakPhaseRunner,
                    data: {
                        duration: (context) => context.settings.longBreak.duration,
                    },
                    onDone:  "focus",
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