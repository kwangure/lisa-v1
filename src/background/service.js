/* global chrome */
export const service_requests = {
    listen: function(services) {
        // @ts-ignore
        chrome.runtime.onMessage.addListener(
            function(request, _sender, sendResponse) {
                if(Object.prototype.hasOwnProperty.call(services, request.service)){
                    let service = services[request.service];
                    if(Object.prototype.hasOwnProperty.call(service, request.method)){
                        sendResponse(service[request.method](...request.args));
                    } else {
                        sendResponse({});
                    }
                }
                return true;
            },
        );
    },
};