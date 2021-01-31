/* global chrome */
import { escapeRegExp } from "../../utils/regex.js";

export class EventListener {
    constructor(namespace = "") {
        this._onEventListeners = new Map();
        this._allEventListeners = new Set();
        const self = this;
        this._eventHandler = (message, _sender, sendResponseFn) => {
            const { event: emittedEvent, payload } = message;
            if (!emittedEvent.startsWith(namespace)) return;

            const escapedRegex = `^${escapeRegExp(namespace)}\\.`;
            const namespaceRegExp = new RegExp(escapedRegex, "u");
            const eventName = emittedEvent.replace(namespaceRegExp, "");
            const eventListeners = self._onEventListeners.get(eventName) || [];
            for (const listener of eventListeners) {
                listener(payload, sendResponseFn);
            }

            for (const listener of self._allEventListeners) {
                listener(eventName, payload);
            }
        };

        chrome.runtime.onMessage.addListener(this._eventHandler);
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
    removeListeners() {
        if (chrome.runtime.onMessage.hasListener(this._eventHandler)) {
            chrome.runtime.onMessage.removeListener(this._eventHandler);
        }
    }
}
