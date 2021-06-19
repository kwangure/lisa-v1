import { sendMessageToRuntime, sendMessageToTabs } from "./emit.js";
import { escapeRegExp } from "../../utils/regex.js";
import typeOf from "just-typeof";

export class EventHandler {
    constructor(namespace = "") {
        this._onEventListeners = new Map();
        this._allEventListeners = new Set();
        this._namespace = namespace;
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
    emit({ event, payload = {}}) {
        event = this._namespace
            ? `${this._namespace}.${event}`
            : event;
        sendMessageToTabs({ event, payload });
        sendMessageToRuntime({ event, payload });
    }
    request(options) {
        let payload = {};
        let query = "";
        if (typeOf(options) === "object") {
            ({ query, payload } = options);
        } else if (typeOf(options) === "string") {
            query = options;
        } else {
            throw TypeError("Expected String or Object.");
        }

        const event = this._namespace ? `${this._namespace}.${query}` : query;
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({ event, payload }, (response) => {
                // eslint-disable-next-line no-unused-expressions
                chrome.runtime.lastError;
                resolve(response);
            });
        });
    }
}
