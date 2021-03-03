import { forwardTo } from "xstate";

export function forward(events, to) {
    return events.reduce((obj, event) => {
        obj[event] = { actions: forwardTo(to) };
        return obj;
    }, {});
}
