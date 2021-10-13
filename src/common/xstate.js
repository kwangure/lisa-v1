export function forward(events, to) {
    return events.reduce((obj, event) => {
        obj[event] = {
            actions: (context, event) => {
                context[to].send(event);
            },
        };
        return obj;
    }, {});
}
