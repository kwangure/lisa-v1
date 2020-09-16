/* global chrome */
// @ts-nocheck
function sendMessageToTabs(message){
    if(chrome.tabs){
        chrome.tabs.query({}, function(tabs){
            for (let i = 0, len = tabs.length; i < len; i++) {
                chrome.tabs.sendMessage(tabs[i].id, message, {}, ()=>{
                    chrome.runtime.lastError;
                });
            }
        });
    }
}

function sendMessageToRuntime(message) {
    // Send messages to other frames e.g extension url, options, popup etc.
    chrome.runtime.sendMessage(message, () => {
        chrome.runtime.lastError;
    });
}

export function emit({ event, data = {}, namespace = ""}) {
    const message = {
        event: namespace ? `${namespace}.${event}` : event,
        data,
    };
    sendMessageToTabs(message);
    sendMessageToRuntime(message);
}

export function request(options) {
    const { namespace = "", query } = options;
    const event = namespace ? `${namespace}.${query}` : query;
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ event }, function (response) {
            chrome.runtime.lastError;
            resolve(response);
        });
    });
}