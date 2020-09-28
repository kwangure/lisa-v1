import { assign, Machine, interpret, spawn } from "xstate";
import { createTimerMachine } from "./timer.js";
import { defaultSettings } from "../settings.js";

export function createPhaseMachine() {
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

    const phaseMachine = Machine({
        id: "phase",
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
                        const timerMachine = createTimerMachine(settings.focus.duration);
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
                        const timerMachine = createTimerMachine(settings.shortBreak.duration);
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
                        const timerMachine = createTimerMachine(settings.longBreak.duration);
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

    return phaseMachine;
}

export function createPomodoroService(pomodoroMachine) {
    const pomodoroService = interpret(pomodoroMachine);
    return pomodoroService;
}