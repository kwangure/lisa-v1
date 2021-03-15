import * as disabledSetup from "./disabledSetup.svelte";
import * as disabledTransition from "./disabledTransition.svelte";
import * as nextPhase from "./nextPhase.svelte";
import * as reminding from "./reminding.svelte";
import * as running from "./running.svelte";
import * as setup from "./setup.svelte";
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
                    TICK: {
                        actions: updateComponent,
                    },
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

function createDisabledMachine(script) {
    return Machine({
        initial: "loading",
        states: {
            loading: {
                always: [
                    { target: "setup", cond: "isSetup" },
                    { target: "default", cond: "isDefault" },
                    { target: "transition", cond: "isTransition" },
                    {
                        actions: (context, event) => {
                            console.error("Unhandled state", { context, event });
                        },
                    },
                ],
            },
            setup: {
                entry: createComponent(disabledSetup, script),
                on: {
                    "DISABLE.START": "default",
                },
                exit: destroyComponent(),
            },
            default: {
                entry: createComponent(running, script),
                on: {
                    "DISABLE.SETUP": "setup",
                    "TICK": {
                        actions: updateComponent,
                    },
                    "DONE": "transition",
                },
                exit: destroyComponent(),
            },
            transition: {
                entry: createComponent(disabledTransition, script),
                on: {
                    "DISABLE.START": "default",
                    "DISABLE.SETUP": "setup",
                },
                exit: destroyComponent(),
            },
        },
    }, {
        guards: {
            isSetup: (context) => context.disabled === "setup",
            isDefault: (context) => context.disabled === "default",
        },
    });
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
            disabled: {
                invoke: {
                    id: "disabledMachine",
                    src: createDisabledMachine(script),
                    // `data` here is xState's API
                    // eslint-disable-next-line id-denylist
                    data: (_, event) => {
                        // `initial` was "disabled"
                        if (event.type === "xstate.init") return initialState;

                        // got to "disabled" through "active" state
                        return event;
                    },
                },
                on: {
                    "DISABLE.END": "active",
                    ...forward([
                        "DISABLE.START",
                        "DONE",
                        "NEXT",
                        "TICK",
                    ], "disabledMachine"),
                },
            },
        },
    });

    const timerService = interpret(timerMachine);

    // Forward background events to client
    timer.all((event, payload) => {
        timerService.send(event, payload);
    });

    return timerService;

}
