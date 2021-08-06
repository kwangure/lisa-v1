import createLisaMachine, { formatLisaData } from "./_machines/lisa";
import { serializeState, stateOrChildStateChanged } from "./xstate.js";
import chromePersistable from "./storage.js";
import clone from "just-clone";
import { defaultSettings } from "~@common/settings";
import { startOfToday } from "date-fns";
import { transformable } from "storables";
import { derived } from "svelte/store";

function serialize(state) {
    return formatLisaData(serializeState(state));
}

function onDone(...stores) {
    return Promise.all(stores.map((store) => new Promise((resolve) => {
        const unsubscribe = store.subscribe((status) => {
            if (status === "done") {
                unsubscribe();
                resolve();
            }
        })
    })));
}

export const { settings, settingsReadStatus, settingsWriteStatus }
    = chromePersistable("settings", clone(defaultSettings));
export const { history, historyReadStatus, historyWriteStatus }
    = chromePersistable("history", {});

const dayStart = startOfToday().toISOString();
// TODO: Create a more ergonomic nestable store
const { today } = transformable({
    name: "history",
    start(set) {
        return history.subscribe(set);
    },
    transforms: {
        today: {
            validate(today) {
                history.update((value) => {
                    value[dayStart()].lastState = today;
                });
            },
            from(history) {
                return history[dayStart()].lastState || {};
            },
        },
    },
});

export function setup() {
    const subscribers = new Set();
    function subscribe(subscriber) {
        subscribers.add(subscriber);
        subscriber(null);
        return () => {
            subscribers.delete(subscriber);
        };
    }

    onDone(settingsReadStatus, historyReadStatus).then(() => {
        const lisaService = createLisaMachine(settings.get());

        lisaService.onTransition((state) => {
            if(stateOrChildStateChanged(state)) {
                today.set(state);
            }
        });

        lisaService.start(today.get().lastState);

        const { send } = lisaService;

        const actions = {
            destroy: () => send("DESTROY"),
            disable: () => send("DISABLE"),
            disableStart: (duration) => send("DISABLE.START", { value: duration }),
            disableEnd: () => send("DISABLE.END"),
            disableCancel: () => send("DISABLE.CANCEL"),
            dismissRemainingWarning: () => send("WARN_REMAINING.DISMISS"),
            extendPrevious: (duration) => send("EXTEND", { value: duration }),
            nextPhase: () => send("NEXT"),
            pause: () => send("PAUSE"),
            pauseDefault: () => send("PAUSE.DEFAULT"),
            play: () => send("PLAY"),
            reset: () => send("RESET"),
            restart: () => send("RESTART"),
            start: () => send("START"),
        };

        for (const subscriber of subscribers) {
            subscriber(actions);
        }
    });

    return {
        lisa: { subscribe },
        state: derived(today, ($today) => {
            return serialize($today.lastState)
        }),
    };
}
