import { Interpreter } from "xstate";

export function serializeState(state) {
    const serialized = {
        value: state.value,
        event: state.event.type,
        changed: state.changed,
        context: state.context,
    };

    if (!state.children) return serialized;

    serialized.children = {};

    for (let [key, child] of Object.entries(state.children)) {
        if (child instanceof Interpreter) {
            key = key.replace(/^\(machine\)\.|:invocation\[\d\]/mgu, "");
            serialized.children[key] = serializeState(child.state);
        }
    }

    return serialized;
}

export function stateOrChildStateChanged(state) {
    return state.changed || childStateChanged(state);
}

function childStateChanged(state) {
    for (const child of Object.values(state.children)) {
        if (stateOrChildStateChanged(child.state)) return true;
    }

    return false;
}
