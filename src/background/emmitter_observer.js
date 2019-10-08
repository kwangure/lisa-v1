function emit_tabs(message){
    if(chrome.tabs){
        chrome.tabs.query({}, function(tabs){
            for (let i = 0, len = tabs.length; i < len; i++) {
            chrome.tabs.sendMessage(tabs[i].id, message, {}, ()=>{});
            }
        })
    }
}

function emit_runtime(message) {
    chrome.runtime.sendMessage(message);
}

export default function (event) {
    emit_tabs(event);
    emit_runtime(event);
}

