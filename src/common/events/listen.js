/* global chrome */
export class EventListener {
    constructor() {
        this._onEventListeners = new Map();
        this._allEventListeners = new Set();

        chrome.runtime.onMessage.addListener((message) => {
            const { event: emittedEvent, data } = message;
            const onEventListeners = this._onEventListeners.get(emittedEvent) || [];
            for (const listener of onEventListeners) {
                listener(data);
            }

            for (const listener of this._allEventListeners) {
                listener(emittedEvent, data);
            }
        });
    }
    on(event, newListener) {
        const listeners = this._onEventListeners.get(event) || new Set();
        this._onEventListeners.set(event, listeners.add(newListener));

        const self = this;
        return function unsubscribe() {
            const listeners = self._onEventListeners.get(event) || new Set();
            listeners.delete(newListener);
            self._onEventListeners.set(event, listeners);
        };
    }
    all(newListener) {
        this._allEventListeners.add(newListener);

        const self = this;
        return function unsubscribe() {
            self._allEventListeners.delete(newListener);
        };
    }
}