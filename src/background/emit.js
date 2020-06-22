/* global chrome */
function emit_tabs(message){
    // @ts-ignore
    if(chrome.tabs){
        // @ts-ignore
        chrome.tabs.query({}, function(tabs){
            for (let i = 0, len = tabs.length; i < len; i++) {
                // @ts-ignore
                chrome.tabs.sendMessage(tabs[i].id, message, {}, ()=>{
                    // @ts-ignore
                    chrome.runtime.lastError;
                });
            }
        });
    }
}

function emit_runtime(message) {
    // @ts-ignore
    chrome.runtime.sendMessage(message, () => {
        // @ts-ignore
        chrome.runtime.lastError;
    });
}

export default function (event, data) {
    let message = {
        event_name: event,
        ...data,
    };
    emit_tabs(message);
    emit_runtime(message);
}

