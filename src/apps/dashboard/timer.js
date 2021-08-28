import createLisaMachine, { formatLisaData } from "./_machines/lisa";
import { serializeState, stateOrChildStateChanged } from "./xstate.js";
import chromePersistable from "./storage.js";
import clone from "just-clone";
import { defaultSettings } from "~@common/settings";
import { readable } from "svelte/store";

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

function throwErrors(...stores) {
    stores.forEach((store) => {
        store.subscribe((status) => {
            if (status === "error") {
                throw store.error;
            }
        });
    });
}

throwErrors(settingsReadStatus, settingsWriteStatus);

export function createTimerStore() {
    const subscribers = new Set();
    function subscribe(subscriber) {
        subscribers.add(subscriber);
        subscriber(null);
        return () => {
            subscribers.delete(subscriber);
        };
    }

    onDone(settingsReadStatus).then(() => {
        const saved_state = JSON.parse(localStorage.getItem("machine-state"));
        let initial_state = {
            status: "setup",
        };
        if (saved_state && saved_state.done === false) {
            initial_state = saved_state;
        }
        const lisaService = createLisaMachine(settings.get(), initial_state);

        const state = readable(initial_state, (set) => {
            lisaService.onTransition((state) => {
                if (stateOrChildStateChanged(state)) {
                    const serialized = serialize(state);
                    localStorage.setItem("machine-state", JSON.stringify(serialized));
                    set(serialized);
                }
            });
        });

        const { send } = lisaService;

        const timer = {
            state,
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
            subscriber(timer);
        }
    });

    return { subscribe };
}
