export function forward(events, to) {
    const obj = {};
    for (const event of events) {
        obj[event] = {
            actions: (_, event) => to().send(event),
        };
    }
    return obj;
}
