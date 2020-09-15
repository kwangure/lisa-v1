/* global chrome */
import { escapeRegExp } from "../../utils/regex.js";

export class EventListener {
    constructor(namespace = "") {
        this._onEventListeners = new Map();
        this._allEventListeners = new Set();

        chrome.runtime.onMessage.addListener((message, _sender, sendResponseFn) => {
            const { event: emittedEvent, data } = message;
            if (!emittedEvent.startsWith(namespace)) return;

            const namespaceRegExp = new RegExp(`^${escapeRegExp(namespace)}\\.`);
            const eventName = emittedEvent.replace(namespaceRegExp, "");
            const onEventListeners = this._onEventListeners.get(eventName) || [];
            for (const listener of onEventListeners) {
                listener(data, sendResponseFn);
            }

            for (const listener of this._allEventListeners) {
                listener(eventName, data);
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