import { assign, Machine, interpret, spawn } from "xstate";
import { createPhaseMachine } from "./phaseStates.js";
import { defaultSettings } from "../settings.js";

export function createPomodoroMachine() {
    function forwardToChild(context, event) {
        return context.timerMachine.send(event.type, event.value);
    }

    const eventsToForwardToChild = () => {
        return {
            PAUSE: {
                actions: forwardToChild,
            },
            PLAY: {
                actions: forwardToChild,
            },
            COMPLETE: {
                actions: forwardToChild,
            },
            RESET: {
                actions: forwardToChild,
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
                    ...eventsToForwardToChild(),
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
                    ...eventsToForwardToChild(),
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
                    ...eventsToForwardToChild(),
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