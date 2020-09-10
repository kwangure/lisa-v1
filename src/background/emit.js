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

export default function emitEventToAllContexts(eventName, data) {
    const message = { event: eventName, data };
    sendMessageToTabs(message);
    sendMessageToRuntime(message);
}
