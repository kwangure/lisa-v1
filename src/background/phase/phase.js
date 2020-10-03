import { assign, Machine, spawn } from "xstate";
import { createTimerMachine } from "./timer.js";

export function createPhaseMachine(withContext = {}) {
    function forwardToChild(context, event) {
        return context.timerMachine.send(event);
    }

    function assignTimerMachine(phase) {
        return assign({
            timerMachine: ({ settings }) => {
                const timerContext = {
                    duration: settings.phaseSettings[phase].duration,
                    position: settings.appearanceSettings.timerPosition,
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
            "DURATION.UPDATE.SAVE": {
                actions: forwardToChild,
            },
            "DURATION.UPDATE.IGNORE": {
                actions: forwardToChild,
            },
            "POSITION.UPDATE.SAVE": {
                actions: forwardToChild,
            },
            "POSITION.UPDATE.IGNORE": {
                actions: forwardToChild,
            },
        };
    };

    const sharedEvents = {
        "SETTINGS.UPDATE": {
            actions: [
                assign({
                    settings: (_context, event) => event.value,
                }),
                (context, _event, meta) => {
                    const { settings, timerMachine } = context;
                    const childContext = timerMachine.state.context;
                    const currentPhase = meta.state.value;
                    const settingDuration = settings.phaseSettings[currentPhase].duration;
                    const currentTimerDuration = childContext.duration;
                    if (settingDuration !== currentTimerDuration){
                        timerMachine.send("DURATION.UPDATE", {
                            durationUpdate: settingDuration,
                        });
                    }

                    const settingsPosition = settings.appearanceSettings.timerPosition;
                    const currentTimerPosition = childContext.position;
                    if (settingsPosition !== currentTimerPosition) {
                        timerMachine.send("POSITION.UPDATE", {
                            positionUpdate: settingsPosition,
                        });
                    }
                },
            ],
        },
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
                    ...sharedEvents,
                },
            },
            shortBreak: {
                entry: assignTimerMachine("shortBreak"),
                on: {
                    DONE: "focus",
                    ...eventsToForwardToChild(),
                    ...sharedEvents,
                },
            },
            longBreak: {
                entry: assignTimerMachine("longBreak"),
                on: {
                    DONE: "focus",
                    ...eventsToForwardToChild(),
                    ...sharedEvents,
                },
            },
        },
    });

    return phaseMachine.withContext({
        ...phaseMachine.context,
        ...withContext,
    });
}