export default class BackgroundListener {
    constructor() {
        this._listeners = new Map();

        chrome.runtime.onMessage.addListener((message) => {
            const { event: emittedEvent, data } = message;
            const listeners = this._listeners.get(emittedEvent) || [];

            for (const listener of listeners) {
                listener(data);
            }
        });
    }
    on(event, newListener) {
        const listeners = this._listeners.get(event) || new Set();
        this._listeners.set(event, listeners.add(newListener));

        const self = this;
        return function unsubscribe() {
            const listeners = self._listeners.get(event) || new Set();
            listeners.delete(newListener);
            self._listeners.set(event, listeners);
        };
    }
}