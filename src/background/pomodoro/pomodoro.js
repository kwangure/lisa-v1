import { createMachine, interpret } from "xstate";
import { createPhaseStates, phaseActions, phaseDelays } from "./phaseStates.js";
import { readable } from "svelte/store";

function createPhaseMachine({ settings }) {
    const { focus, shortBreak, longBreak } = settings;

    const focusPhaseStates = createPhaseStates({ duration: focus.duration });
    const shortBreakPhaseStates = createPhaseStates({ duration: shortBreak.duration });
    const longBreakPhaseStates = createPhaseStates({ duration: longBreak.duration });

    const pomodoroMachine = {
        id: "pomodoro",
        initial: "focus",
        context: {
            // TODO(kwangure): update this dynamically
            nextPhase: "shortBreak",
        },
        states: {
            focus: {
                ...focusPhaseStates,
                on: {
                    COMPLETE: [
                        {
                            target: "shortBreak",
                            cond: (context) => context.nextPhase === "shortBreak",
                        },
                        {
                            target: "longBreak",
                        },
                    ],
                },
            },
            shortBreak: {
                ...shortBreakPhaseStates,
                on: {
                    COMPLETE: "focus",
                },
            },
            longBreak: {
                ...longBreakPhaseStates,
                on: {
                    COMPLETE: "focus",
                },
            },
        },
    };

    const machineOptions = {
        delays: phaseDelays,
        actions: phaseActions,
    };

    return createMachine(pomodoroMachine, machineOptions);
}

export default function startPomodoroService(options) {
    const { settings = {} } = options;

    const phaseMachine = createPhaseMachine(settings);
    const pomodoroService = interpret(phaseMachine);

    const pomodoroReadable = readable({}, function start(setStoreValue) {
        pomodoroService.onTransition((state) => {
            if (state.changed) {
                setStoreValue(state.value);
            }
        });
    });

    return { pomodoroReadable, pomodoroService };
}