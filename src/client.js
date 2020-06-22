/* global chrome */
function proxy(service){
    let root = {
        on: function(event, event_listener){
            // @ts-ignore
            chrome.runtime.onMessage.addListener((message)=>{
                const { event_name, ...value} = message;
                if(event == event_name) {
                    event_listener(value);
                }
            });
        },
    };
    return new Proxy(root,{
        get(target, propKey){
            if(target[propKey]){
                return target[propKey];
            }
            return (...args) => {
                // @ts-ignore
                return new Promise((resolve) => {
                    // @ts-ignore
                    chrome.runtime.sendMessage(
                        {service, method: propKey, args},
                        function(response){
                            // @ts-ignore
                            if(chrome.runtime.lastError){
                                console.log(
                                    "Failed response",
                                    {service, method: propKey, args},
                                );
                            }
                            resolve(response);
                        });
                });
            };
        },
    });
}

export const pomodoro_client = proxy("pomodoro");
export const settings_client = proxy("settings");
export const sound_client = proxy("sound");