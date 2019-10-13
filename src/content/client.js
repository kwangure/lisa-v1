function proxy(service, root={}){
    return new Proxy(root,{
        get(target, propKey){
            if(target[propKey]){
                return target[propKey]
            }
            return () => {
                return new Promise((resolve, reject) => {
                    chrome.runtime.sendMessage(
                        {service, name: propKey}, 
                        function(response){
                            resolve(response)
                    })
                })
            }
        }
    })
}

let pomodoro_actions = {
    on: function(event, event_listener){
        chrome.runtime.onMessage.addListener((message)=>{
            const { event_name, ...pomodoro_status} = message
            if(event == event_name){
                event_listener(pomodoro_status)
            }
        });
    }
}

export const pomodoro_client = proxy("pomodoro", pomodoro_actions);
export const settings_client = proxy("settings");