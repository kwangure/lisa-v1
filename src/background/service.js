export const service_requests = {
    listen: function(services) {
        chrome.runtime.onMessage.addListener(
            function(request, sender, sendResponse) {
                if(services.hasOwnProperty(request.service)){
                    let service = services[request.service];
                    if(service.hasOwnProperty(request.method)){
                        sendResponse(service[request.method](...request.args));
                    } else {
                        sendResponse({});
                    }
                }
                return true;
            }
        );
    }
}