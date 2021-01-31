/* global chrome */
// @ts-nocheck
function sendMessageToTabs(message) {
    if (chrome.tabs) {
        chrome.tabs.query({}, (tabs) => {
            for (let i = 0, len = tabs.length; i < len; i++) {
                chrome.tabs.sendMessage(tabs[i].id, message, {}, () => {
                    // eslint-disable-next-line no-unused-expressions
                    chrome.runtime.lastError;
                });
            }
        });
    }
}

function sendMessageToRuntime(message) {
    // Send messages to other frames e.g extension url, options, popup etc.
    chrome.runtime.sendMessage(message, () => {
        // eslint-disable-next-line no-unused-expressions
        chrome.runtime.lastError;
    });
}

export function emit({ event, payload = {}, namespace = "" }) {
    const message = {
        event: namespace ? `${namespace}.${event}` : event,
        payload: payload,
    };
    sendMessageToTabs(message);
    sendMessageToRuntime(message);
}

export function request(options) {
    const { namespace = "", query } = options;
    const event = namespace ? `${namespace}.${query}` : query;
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ event }, (response) => {
            // eslint-disable-next-line no-unused-expressions
            chrome.runtime.lastError;
            resolve(response);
        });
    });
}
