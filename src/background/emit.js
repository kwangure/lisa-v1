function emit_tabs(message){
    if(chrome.tabs){
        chrome.tabs.query({ active: true }, function(tabs){
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

export default function (service, data) {
    let message = {
        event_name: service,
        ...data,
    };
    emit_tabs(message);
    emit_runtime(message);
}

