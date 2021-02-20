/* global chrome */
// @ts-nocheck
export function sendMessageToTabs(message) {
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

export function sendMessageToRuntime(message) {
    // Send messages to other frames e.g extension url, options, popup etc.
    chrome.runtime.sendMessage(message, () => {
        // eslint-disable-next-line no-unused-expressions
        chrome.runtime.lastError;
    });
}
