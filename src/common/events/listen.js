/* global chrome */
import { escapeRegExp } from "../../utils/regex.js";

export class EventListener {
    constructor(namespace = "") {
        this._onEventListeners = new Map();
        this._allEventListeners = new Set();
        const self = this;
        this._eventHandler = function (message, _sender, sendResponseFn) {
            const { event: emittedEvent, data } = message;
            if (!emittedEvent.startsWith(namespace)) return;

            const namespaceRegExp = new RegExp(`^${escapeRegExp(namespace)}\\.`);
            const eventName = emittedEvent.replace(namespaceRegExp, "");
            const onEventListeners = self._onEventListeners.get(eventName) || [];
            for (const listener of onEventListeners) {
                listener(data, sendResponseFn);
            }

            for (const listener of self._allEventListeners) {
                listener(eventName, data);
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