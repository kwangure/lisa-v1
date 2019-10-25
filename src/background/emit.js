function emit_tabs(message){
    if(chrome.tabs){
        chrome.tabs.query({}, function(tabs){
            for (let i = 0, len = tabs.length; i < len; i++) {
                chrome.tabs.sendMessage(tabs[i].id, message, {}, ()=>{
                    chrome.runtime.lastError
                });
            }
        })
    }
}

function emit_runtime(message) {
    chrome.runtime.sendMessage(message, () => {
        chrome.runtime.lastError
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

