import { assign, Machine, send, spawn } from "xstate";
import audio from "../../common/audio";
import { createTimerMachine } from "./timer.js";

export function createPhaseMachine(withContext = {}) {
    function forwardToChild(context, event) {
        return context.timerMachine.send(event);
    }

    function assignTimerMachine(phase) {
        return assign({
            timerMachine: (context, event) => {
                context.timerMachine?.stop();
                const { settings, previousTimerContext } = context;
                const timerContext = {
                    duration: settings.phaseSettings[phase].duration,
                    position: settings.appearanceSettings.timerPosition,
                };
                if (event.type === "EXTEND") {
                    timerContext.duration = previousTimerContext.duration;
                    timerContext.extendedDuration
                        = previousTimerContext.extendedDuration + event.value;
                    timerContext.elapsed = previousTimerContext.elapsed;
                    timerContext.isExtension = true;
                }

                const timerMachine = createTimerMachine(timerContext);
                return spawn(timerMachine, { sync: true });
            },
        });
    }

    const eventsToForwardToChild = () => ({
        "PAUSE": {
            actions: forwardToChild,
        },
        "PAUSE.DEFAULT": {
            actions: forwardToChild,
        },
        "PLAY": {
            actions: forwardToChild,
        },
        "COMPLETE": {
            actions: forwardToChild,
        },
        "RESET": {
            actions: forwardToChild,
        },
        "WARN_REMAINING.DISMISS": {
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
    });

    const sharedEvents = {
        "DONE": [
            {
                actions: [
                    assign({
                        previousPhase: (_, __, meta) => meta.state.value,
                        previousTimerContext: (context) => Object.assign(
                            {},
                            context.timerMachine.state.context,
                        ),
                    }),
                    assign({
                        focusPhasesSinceStart: (context, _event) => {
                            let {
                                focusPhasesSinceStart = 0,
                                previousPhase,
                                previousTimerContext,
                            } = context;
                            if (previousPhase === "longBreak") {
                                return 0;
                            }
                            const { isExtension } = previousTimerContext;

                            if (previousPhase === "focus" && !isExtension) {
                                focusPhasesSinceStart += 1;
                            }

                            return focusPhasesSinceStart;
                        },
                    }),
                    assign({
                        focusPhasesUntilLongBreak: (context) => {
                            const {
                                settings: { phaseSettings: { longBreak }},
                                focusPhasesSinceStart,
                            } = context;
                            const longBreakInterval = longBreak.interval;

                            // Use % in case `focusPhasesSinceStart` > `longBreakInterval` because
                            // settings was changed during phase
                            // eslint-disable-next-line max-len
                            return longBreakInterval - ((focusPhasesSinceStart - 1) % longBreakInterval) - 1;
                        },
                        hasLongBreak: ({ settings }) => (
                            settings.phaseSettings.longBreak.interval > 0
                        ),
                    }),
                    assign({
                        nextPhase: (context, _event, meta) => {
                            const currentPhase = meta.state.value;

                            if (
                                currentPhase === "shortBreak"
                                || currentPhase === "longBreak"
                            ) {
                                return "focus";
                            }

                            const {
                                focusPhasesUntilLongBreak,
                                hasLongBreak,
                            } = context;
                            if (!hasLongBreak) {
                                return "shortBreak";
                            }

                            if (focusPhasesUntilLongBreak === 0) {
                                return "longBreak";
                            } else {
                                return "shortBreak";
                            }
                        },
                    }),
                    send("IDLE"),
                ],
            },
        ],
        "RESTART": {
            actions: [
                assign({
                    nextPhase: () => "focus",
                    focusPhasesSinceStart: () => 0,
                    focusPhasesUntilLongBreak: (context) => (
                        context.settings.phaseSettings.longBreak
                    ),
                }),
                send("IDLE"),
            ],
        },
        "IDLE": "idle",
        "SETTINGS.UPDATE": {
            actions: [
                assign({
                    settings: (_context, event) => event.value,
                }),
                (context, _event, meta) => {
                    const { settings, timerMachine } = context;
                    const currentPhase = meta.state.value;
                    const settingDuration
                        = settings.phaseSettings[currentPhase].duration;
                    timerMachine.send("DURATION.UPDATE", {
                        durationUpdate: settingDuration,
                    });

                    const settingsPosition
                        = settings.appearanceSettings.timerPosition;
                    timerMachine.send("POSITION.UPDATE", {
                        positionUpdate: settingsPosition,
                    });
                },
            ],
        },
        "POSITION.UPDATE.FORCE_SAVE": {
            actions: (context, event) => {
                context.timerMachine.send([
                    {
                        type: "POSITION.UPDATE",
                        positionUpdate: event.value.position,
                    },
                    { type: "POSITION.UPDATE.SAVE" },
                ]);
            },
        },
    };

    const phaseMachine = Machine({
        id: "phase",
        initial: "focus",
        context: {
            timerMachine: null,
        },
        states: {
            focus: {
                // TODO: Change timer machine data instead of replacing machine
                // entirely
                entry: assignTimerMachine("focus"),
                on: {
                    ...eventsToForwardToChild(),
                    ...sharedEvents,
                },
            },
            shortBreak: {
                entry: assignTimerMachine("shortBreak"),
                on: {
                    ...eventsToForwardToChild(),
                    ...sharedEvents,
                },
            },
            longBreak: {
                entry: assignTimerMachine("longBreak"),
                on: {
                    ...eventsToForwardToChild(),
                    ...sharedEvents,
                },
            },
            idle: {
                entry: [
                    assign({
                        isRestart: (_, __, meta) => (
                            meta.state.event.type === "RESTART"
                        ),
                    }),
                    assign({
                        notification: (context) => {
                            const {
                                isRestart,
                                nextPhase,
                                hasLongBreak,
                                focusPhasesUntilLongBreak,
                            } = context;
                            let title = "Start focusing";

                            if (isRestart) {
                                return;
                            }

                            if (nextPhase === "shortBreak") {
                                title = hasLongBreak
                                    ? "Take a short break"
                                    : "Take a break";
                            }

                            if (nextPhase === "longBreak") {
                                title = "Take a long break";
                            }

                            const message = focusPhasesUntilLongBreak > 0
                                // eslint-disable-next-line max-len
                                ? `${focusPhasesUntilLongBreak} focus sessions until long break`
                                : "";

                            return new Notification(title, {
                                body: message,
                                icon: "images/browser-action.png",
                                requireInteraction: true,
                            });
                        },
                    }),
                    (context) => {
                        const {
                            isRestart,
                            previousPhase,
                            settings: { phaseSettings },
                        } = context;
                        if (isRestart) {
                            return;
                        }
                        const notificationSound
                        = phaseSettings[previousPhase].notification.sound;
                        if (notificationSound) {
                            audio.play(notificationSound);
                        }
                    },
                ],
                invoke: {
                    src: (context) => (sendParentEvent) => {
                        if (context.isRestart) {
                            sendParentEvent("NEXT");
                        } else {
                            context.notification.onclick = () => {
                                sendParentEvent("NEXT");
                            };
                        }
                    },
                },
                on: {
                    NEXT: [
                        {
                            target: "shortBreak",
                            cond: (context) => (
                                context.nextPhase === "shortBreak"
                            ),
                        },
                        {
                            target: "longBreak",
                            cond: (context) => (
                                context.nextPhase === "longBreak"
                            ),
                        },
                        { target: "focus" },
                    ],
                    EXTEND: [
                        {
                            target: "shortBreak",
                            cond: (context) => (
                                context.previousPhase === "shortBreak"
                            ),
                        },
                        {
                            target: "longBreak",
                            cond: (context) => (
                                context.previousPhase === "longBreak"
                            ),
                        },
                        { target: "focus" },
                    ],
                },
                exit: [
                    assign({
                        notification: (context) => {
                            context.notification?.close();
                            return null;
                        },
                    }),
                    assign({
                        isRestart: () => false,
                    }),
                ],
            },
        },
    });

    return phaseMachine.withContext({
        ...phaseMachine.context,
        ...withContext,
    });
}
