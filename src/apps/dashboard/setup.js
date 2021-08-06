import createLisaMachine, { formatLisaData } from "./_machines/lisa";
import { serializeState, stateOrChildStateChanged } from "./xstate.js";
import clone from "just-clone";
import { defaultSettings } from "~@common/settings";
import { interpret } from "xstate";
import { startOfToday } from "date-fns";
import storageWritable from "./storage.js";
import { writable } from "./object-writable";

function serialize(state) {
    return formatLisaData(serializeState(state));
}

export const settingsStorage = storageWritable("lisa-settings", clone(defaultSettings));
export const historyStorage = storageWritable("lisa-history", {});

export function setup() {
    let actions = {};
    const { subscribe } = writable(null, async (set) => {
        const [settings, unsubscribeSettings] = await settingsStorage.get();
        const lisaMachine = createLisaMachine(settings);
        const lisaService = interpret(lisaMachine);

        const [history, unsubscribeHistory] = await historyStorage.get();
        const today = startOfToday().getTime();

        if (!history[today]) {
            history[today] = {};
        }

        let writableValue;
        lisaService.onTransition((state) => {
            if (stateOrChildStateChanged(state)) {
                history[today].lastState = state;
                writableValue = serialize(state);
                set(writableValue);
            }
        });

        const lastState = history[today]?.lastState;
        lisaService.start(lastState);

        set(serialize(lisaService.initialState));

        Object.assign(actions, {
            destroy() {
                lisaService.send("DESTROY");
            },
            disable() {
                lisaService.send("DISABLE");
            },
            disableStart(duration) {
                lisaService.send("DISABLE.START", { value: duration });
            },
            disableEnd() {
                lisaService.send("DISABLE.END");
            },
            disableCancel() {
                lisaService.send("DISABLE.CANCEL");
            },
            dismissRemainingWarning() {
                lisaService.send("WARN_REMAINING.DISMISS");
            },
            extendPrevious(duration) {
                lisaService.send("EXTEND", { value: duration });
            },
            nextPhase() {
                lisaService.send("NEXT");
            },
            pause() {
                lisaService.send("PAUSE");
            },
            pauseDefault() {
                lisaService.send("PAUSE.DEFAULT");
            },
            play() {
                lisaService.send("PLAY");
            },
            reset() {
                lisaService.send("RESET");
            },
            restart() {
                lisaService.send("RESTART");
            },
            start() {
                lisaService.send("START");
            },
        });

        return () => {
            actions = {};
            unsubscribeHistory();
            unsubscribeSettings();
        };
    });

    return Object.assign(actions, { subscribe });
}
