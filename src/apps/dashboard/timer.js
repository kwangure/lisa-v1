import createLisaMachine, { formatLisaData } from "./_machines/lisa";
import { serializeState, stateOrChildStateChanged } from "./xstate.js";
import chromePersistable from "./storage.js";
import clone from "just-clone";
import { defaultSettings } from "~@common/settings";
import { writable } from "svelte/store";

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
        const lisa_service = createLisaMachine(settings.get());
        const state = writable(serialize(lisa_service.state));
        lisa_service.onTransition((machineState) => {
            if (machineState.event.type === "xstate.init") return;
            if (stateOrChildStateChanged(machineState)) {
                state.set(serialize(machineState));
            }
        });

        const { send } = lisa_service;

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
