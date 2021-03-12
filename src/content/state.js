import * as nextPhase from "./dialogs/nextPhase.svelte";
import * as reminding from "./dialogs/reminding.svelte";
import * as running from "./timer/running.svelte";
import * as setup from "./dialogs/setup.svelte";
import { interpret, Machine } from "xstate";
import { forward } from "../common/xstate";
import { timer } from "../common/events";

let instance, preload, target;

function createComponent(component, script) {
    return (context, event) => {
        const props = event.type === "xstate.init" ? context : event;
        preload = component.preload || (() => {});
        instance = new component.default({
            target: target,
            props: {
                script,
                ...preload(props),
            },
        });
    };
}

function updateComponent(_, event) {
    instance?.$set(preload?.(event));
}

function destroyComponent() {
    return () => {
        instance?.$destroy?.();
        instance = null;
        preload = null;
    };
}

function createTimerMachine(script) {
    const timerMachine = Machine({
        initial: "loading",
        context: {},
        states: {
            loading: {
                always: [
                    { target: "running", cond: "isRunning" },
                    { target: "paused", cond: "isPaused" },
                    { target: "transition", cond: "isTransition" },
                ],
            },
            running: {
                id: "running",
                entry: createComponent(running, script),
                on: {
                    DONE: "transition",
                    PAUSE: "paused",
                    TICK: {
                        actions: updateComponent,
                    },
                },
                exit: destroyComponent(),
            },
            paused: {
                initial: "default",
                states: {
                    default: {
                        entry: createComponent(running, script),
                        on: {
                            "PAUSE.REMIND": "reminding",
                        },
                        exit: destroyComponent(),
                    },
                    reminding: {
                        entry: createComponent(reminding, script),
                        on: {
                            "PAUSE.DEFAULT": "default",
                        },
                        exit: destroyComponent(),
                    },
                },
                on: {
                    DONE: "transition",
                    PLAY: "running",
                },
            },
            transition: {
                entry: createComponent(nextPhase, script),
                on: {
                    EXTEND: "running",
                    NEXT: "running",
                },
                exit: destroyComponent(),
            },
        },
    }, {
        guards: {
            isRunning: (context) => context.timer?.state === "running",
            isPaused: (context) => context.timer?.state.paused,
            isTransition: (context) => context.phase === "transition",
        },
    });

    return timerMachine;
}

export async function createLisaMachine(options) {
    target = options.target || document.body;
    const { script } = options;
    const initialState = await timer.getState();
    const timerMachine = Machine({
        initial: initialState.status,
        context: {},
        states: {
            setup: {
                entry: createComponent(setup, script),
                on: {
                    DISABLE: "disabled",
                    START: "active",
                },
                exit: destroyComponent(),
            },
            active: {
                invoke: {
                    id: "timer",
                    src: createTimerMachine(script),
                    // `data` here is xState's API
                    // eslint-disable-next-line id-denylist
                    data: (_, event) => {
                        // `initial` was "active"
                        if (event.type === "xstate.init") return initialState;

                        // got to "active" through "setup" state
                        return event;
                    },
                },
                on: {
                    DISABLE: "disabled",
                    ...forward([
                        "DONE",
                        "EXTEND",
                        "NEXT",
                        "PAUSE",
                        "PAUSE.REMIND",
                        "PAUSE.DEFAULT",
                        "PLAY",
                        "TICK",
                    ], "timer"),
                },
            },
            disabled: {},
        },
    });

    const timerService = interpret(timerMachine);

    // Forward background events to client
    timer.all((event, payload) => {
        timerService.send(event, payload);
    });

    return timerService;

}
