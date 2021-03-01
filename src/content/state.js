/* eslint-disable max-len */
import * as nextPhase from "./dialogs/nextPhase.svelte";
import * as reminding from "./dialogs/reminding.svelte";
import * as running from "./timer/running.svelte";
import * as updateDuration from "./dialogs/updateDuration.svelte";
import * as updatePosition from "./dialogs/updatePosition.svelte";
import { assign, interpret, Machine } from "xstate";
import { timer } from "../common/events";

function isDurationUpdate(_, event) {
    return event.data.timer.state.updating === "duration";
}
function isPositionUpdate(_, event) {
    return event.data.timer.state.updating === "position";
}
function isRunning(_, event) {
    return event.data.timer.state.running;
}
function isPaused(_, event) {
    return event.data.timer.state.paused;
}
function isIdle(_, event) {
    return event.data.name === "idle";
}

const handleSettingsUpdate = [
    {
        target: "updating.duration",
        cond: "isDurationUpdate",
    },
    {
        target: "updating.position",
        cond: "isPositionUpdate",
    },
];

const handleDurationChange = [
    {
        target: "#running",
        cond: "isRunning",
    },
    {
        target: "position",
        cond: "isPositionUpdate",
    },
];

const handlePositionChange = [
    {
        target: "#running",
        cond: "isRunning",
    },
    {
        target: "duration",
        cond: "isDurationUpdate",
    },
];

function createComponent(component, target) {
    return assign((_, event) => {
        const { default: Component, preload } = component;

        return {
            component: new Component({
                target: target,
                props: preload(event.data),
            }),
            preload: preload,
        };
    });
}

function updateComponent(context, event) {
    const { component, preload } = context;
    component?.$set(preload?.(event.data));
}

function destroyComponent() {
    return assign((context) => {
        context.component?.$destroy?.();
        return { component: null, preload: null };
    });
}

export async function createTimerMachine({ target = document.body }) {
    const isInitialized = await timer.isInitialized();
    const timerMachine = Machine({
        initial: isInitialized ? "initialized" : "uninitialized",
        context: {},
        states: {
            initialized: {
                initial: "loading",
                states: {
                    loading: {
                        entry: () => console.log("loading"),
                        invoke: {
                            src: (_, event) => {
                                if (event.type === "xstate.init") {
                                    return timer.getState();
                                }

                                return Promise.resolve(event.data);
                            },
                            onDone: [
                                { target: "running", cond: "isRunning" },
                                { target: "paused", cond: "isPaused" },
                                { target: "idle", cond: "isIdle" },
                                { actions: (context, event) => {
                                    console.error("Unhandled state", { context, event });
                                } },
                            ],
                        },
                    },
                    running: {
                        id: "running",
                        entry: createComponent(running, target),
                        on: {
                            "TICK": {
                                actions: updateComponent,
                            },
                            "PAUSE": "paused",
                            "IDLE": "idle",
                            "SETTINGS.UPDATE": handleSettingsUpdate,
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
                            "PLAY": "running",
                            "SETTINGS.UPDATE": handleSettingsUpdate,
                        },
                        exit: destroyComponent(),
                    },
                    updating: {
                        states: {
                            duration: {
                                entry: createComponent(updateDuration, target),
                                on: {
                                    "DURATION.UPDATE.SAVE": handleDurationChange,
                                    "SETTINGS.UPDATE": {
                                        actions: updateComponent,
                                    },
                                    "DURATION.UPDATE.IGNORE": handleDurationChange,
                                },
                                exit: destroyComponent(),
                            },
                            position: {
                                entry: createComponent(updatePosition, target),
                                on: {
                                    "POSITION.UPDATE.SAVE": handlePositionChange,
                                    "SETTINGS.UPDATE": {
                                        actions: updateComponent,
                                    },
                                    "POSITION.UPDATE.IGNORE": handlePositionChange,
                                },
                                exit: destroyComponent(),
                            },
                        },
                    },
                    idle: {
                        entry: createComponent(nextPhase, target),
                        on: {
                            NEXT: "running",
                            EXTEND: "running",
                        },
                        exit: destroyComponent(),
                    },
                },
            },
            uninitialized: {
                entry: () => timer.start(),
                on: {
                    START: "initialized",
                },
            },
        },
    }, {
        guards: {
            isDurationUpdate,
            isPositionUpdate,
            isPaused,
            isRunning,
            isIdle,
        },
    });

    const timerService = interpret(timerMachine);

    timer.all((event, payload) => {
        if (event.startsWith("xstate.")) return;

        // Use `data` prop to match result from xstate's `invoke.src`
        // eslint-disable-next-line id-denylist
        timerService.send(event, { data: payload });
    });

    return timerService;
}
