import { assign, Machine, spawn } from "xstate";
import { createTimerMachine } from "./timer.js";

export function createPhaseMachine(withContext = {}) {
    function forwardToChild(context, event) {
        return context.timerMachine.send(event.type, event.value);
    }

    function assignTimerMachine(phase) {
        return assign({
            timerMachine: (phaseContext) => {
                const timerContext = {
                    duration: phaseContext.settings[phase].duration,
                };
                const timerMachine = createTimerMachine(timerContext);
                return spawn(timerMachine, { sync: true });
            },
        });
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
            nextPhase: "shortBreak",
            timerMachine: null,
        },
        states: {
            focus: {
                entry: assignTimerMachine("focus"),
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
                entry: assignTimerMachine("shortBreak"),
                on: {
                    DONE: "focus",
                    ...eventsToForwardToChild(),
                },
            },
            longBreak: {
                entry: assignTimerMachine("longBreak"),
                on: {
                    DONE: "focus",
                    ...eventsToForwardToChild(),
                },
            },
        },
    });

    return phaseMachine.withContext({
        ...phaseMachine.context,
        ...withContext,
    });
}