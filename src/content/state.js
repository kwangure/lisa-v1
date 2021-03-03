import * as nextPhase from "./dialogs/nextPhase.svelte";
import * as reminding from "./dialogs/reminding.svelte";
import * as running from "./timer/running.svelte";
import * as setup from "./dialogs/setup.svelte";
import { interpret, Machine } from "xstate";
import { forward } from "../common/xstate";
import { timer } from "../common/events";

let instance, preload, target;

function createComponent(component) {
    return (context, event) => {
        const props = event.type === "xstate.init" ? context : event;
        preload = component.preload || (() => {});
        instance = new component.default({
            target: target,
            props: preload(props),
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

function createTimerMachine(target) {
    const timerMachine = Machine({
        initial: "running",
        context: {},
        states: {
            running: {
                id: "running",
                entry: createComponent(running, target),
                on: {
                    TICK: {
                        actions: updateComponent,
                    },
                    PAUSE: "paused",
                },
                exit: destroyComponent(),
            },
            paused: {
                initial: "default",
                states: {
                    default: {
                        entry: createComponent(running, target),
                        on: {
                            "PAUSE.REMIND": "reminding",
                        },
                        exit: destroyComponent(),
                    },
                    reminding: {
                        entry: createComponent(reminding, target),
                        on: {
                            "PAUSE.DEFAULT": "default",
                        },
                        exit: destroyComponent(),
                    },
                },
                on: {
                    PLAY: "running",
                },
            },
            completed: {
                entry: createComponent(nextPhase, target),
                on: {
                    NEXT: "running",
                    EXTEND: "running",
                },
                exit: destroyComponent(),
            },
        },
    });

    return timerMachine;
}

export async function createLisaMachine(options) {
    target = options.target || document.body;
    const initialState = await timer.getState();
    const timerMachine = Machine({
        initial: initialState.status,
        context: {},
        states: {
            setup: {
                entry: createComponent(setup, target),
                on: {
                    DISABLE: "disabled",
                    START: "active",
                },
                exit: destroyComponent(),
            },
            active: {
                invoke: {
                    id: "timer",
                    src: createTimerMachine(target),
                    // This is xState's API
                    // eslint-disable-next-line id-denylist
                    data: (_, event) => event,
                },
                on: {
                    DISABLE: "disabled",
                    ...forward([
                        "TICK",
                        "PAUSE",
                        "PAUSE.REMIND",
                        "PAUSE.DEFAULT",
                        "PLAY",
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
