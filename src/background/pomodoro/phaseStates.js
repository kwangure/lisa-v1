import { assign } from "xstate";

const ONE_SECOND = 1000;

export const phaseActions = {
    elapseSecond: assign({
        elapse: context => context.elapsed + ONE_SECOND,
    }),
};

export const phaseDelays = {
    ONE_SECOND,
};

export function createPhaseStates({ duration, elapsed = 0 }) {
    const phaseStates = {
        initial: "paused",
        context: {
            duration,
            elapsed,
        },
        states: {
            running: {
                entry: "elapseSecond",
                after: {
                    ONE_SECOND: [
                        {
                            target: "completed",
                            cond: context => context.duration === context.elapsed,
                        },
                        {
                            target: "running",
                        },
                    ],
                },
                on: {
                    COMPLETE: "completed",
                    PAUSE: "paused",
                },
            },
            paused: {
                on: {
                    COMPLETE: "completed",
                    PLAY: "running",
                },
            },
            completed: {
                type: "final",
            },
        },
    };

    return phaseStates;
}