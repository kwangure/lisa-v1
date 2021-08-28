import { assign, Machine, sendParent } from "xstate";
import { differenceInMilliseconds, isBefore } from "date-fns";

export default function createDisabledMachine(settings, saved_state) {
    const disabledTimerMachine = Machine({
        initial: "running",
        context: {
            state: "running",
            disabledEnd: 0,
            remaining: 0,
        },
        states: {
            running: {
                entry: [
                    assign({ state: "running" }),
                    "sendParentUpdate",
                ],
                invoke: {
                    src: () => (sendParentEvent) => {
                        const id = setInterval(() => sendParentEvent("TICK"), 1000);

                        return () => clearInterval(id);
                    },
                },
                on: {
                    TICK: {
                        actions: [
                            "calculateRemaining",
                            "sendParentUpdate",
                        ],
                    },
                },
                always: [
                    { target: "completed", cond: "isCompleted" },
                ],
            },
            completed: {
                entry: [
                    assign({ state: "completed" }),
                    "sendParentUpdate",
                ],
                type: "final",
            },
        },
    }, {
        actions: {
            calculateRemaining: assign({
                remaining: (context) => {
                    const { disabledEnd } = context;
                    return differenceInMilliseconds(disabledEnd, Date.now());
                },
            }),
            sendParentUpdate: sendParent((context) => ({
                type: "TIMER.UPDATE",
                payload: context,
            })),
        },
        guards: {
            isCompleted: (context) => isBefore(context.disabledEnd, Date.now()),
        },
    });

    let initial_state = "default";
    if (saved_state.status === "disabled") {
        initial_state = saved_state.disabled;
    }

    return Machine({
        initial: initial_state,
        context: {},
        states: {
            default: {
                invoke: {
                    id: "timerMachine",
                    src: disabledTimerMachine,
                    data: () => {
                        const { duration } = settings.phaseSettings["disabled"];
                        const disabledEnd = new Date(duration);

                        return {
                            disabledEnd: disabledEnd,
                            remaining: differenceInMilliseconds(disabledEnd, Date.now()),
                            state: "running",
                        };
                    },
                    onDone: {
                        target: "transition",
                        actions: [
                            sendParent("DONE"),
                        ],
                    },
                },
                on: {
                    "TIMER.UPDATE": {
                        actions: [
                            "updateTimerData",
                            sendParent("TIMER.UPDATE"),
                        ],
                    },
                },
            },
            transition: {
                on: {
                    "DISABLE.END": {
                        actions: sendParent("DISABLE.END"),
                    },
                    "DISABLE.START": {
                        target: "default",
                        actions: (_, event) => {
                            settings.phaseSettings["disabled"].duration = event.value;
                        },
                    },
                },
            },
        },
    }, {
        actions: {
            updateTimerData: assign({
                timerMachine: (_, event) => event.payload,
            }),
        },
    });
}
