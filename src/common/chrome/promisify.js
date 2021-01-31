/* global chrome */
const chromeAPIs = {
    management: ["getSelf"],
    runtime: ["getPackageDirectoryEntry"],
    tabs: ["query"],
};

const chromeAsync = {};

function createFallbackProxy(object, fallback) {
    return new Proxy(object, {
        get(object, property) {
            if (object[property]) {
                return createFallbackProxy(
                    object[property],
                    fallback[property],
                );
            }
            return fallback[property];
        },
    });
}

// If `chromeAsync.prop.func` is not implemented, fall back to `chrome.prop.func`
export default createFallbackProxy(chromeAsync, chrome);

for (const [api, methods] of Object.entries(chromeAPIs)) {
    // API not allowed by current extension permissions
    if (!chrome[api]) {
        continue;
    }

    chromeAsync[api] = {};

    for (const method of methods) {
        chromeAsync[api][method] = (...inputArgs) => (
            new Promise((resolve, reject) => {
                function chromeCallback(...args) {
                    if (chrome.runtime.lastError) {
                        reject(new Error(`
Unsuccessful call to "chrome.${api}.${method}"

Error: ${chrome.runtime.lastError.message || chrome.runtime.lastError}
                        `.trim()));
                    } else {
                        if (args.length === 0) {
                            resolve();
                        } else if (args.length === 1) {
                            resolve(args[0]);
                        } else {
                            console.error("We'll be `Object`ifying args soon");
                            resolve(args);
                        }
                    }
                }
                const argumentsToPass = [...inputArgs, chromeCallback];
                chrome[api][method](...argumentsToPass);
            })
        );
    }
}
