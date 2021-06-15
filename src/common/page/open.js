import { normalizeUrl } from "~@utils/url";

const manifest = chrome.runtime.getManifest();

function normalizeWithoutHash(url) {
    return normalizeUrl(url, {
        stripHash: true,
        stripParams: true, // TODO: strip params
    });
}

async function openExtensionPage(url) {
    const targetNoHash = normalizeWithoutHash(url);
    const targetRoute = normalizeUrl(url);
    const windows = chrome.extension.getViews();
    for (const window of windows) {
        const { id: tabId, windowId } = await new Promise((resolve) => {
            window.chrome.tabs.getCurrent((tab) => {
                resolve(tab || {});
            });
        });

        const focusTab = (onFocus) => {
            chrome.tabs.update(tabId, { active: true, highlighted: true });
            chrome.windows.update(windowId, { focused: true }, onFocus);
        };

        const exactUrlMatches = normalizeUrl(window.location.href) === targetRoute;
        if (exactUrlMatches) {
            return new Promise(focusTab);
        }

        // If window with exact url but different hash found change url then focus
        const equalWithoutHash = normalizeWithoutHash(window.location.href) === targetNoHash;
        if (equalWithoutHash) {
            return new Promise((resolve) => {
                chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
                    if (details.tabId === tabId) {
                        focusTab(resolve);
                    }
                });

                window.location.href = url;
            });
        }
    }

    // Tab with url doesn't exist, so create it
    return new Promise((resolve) => {
        chrome.tabs.create({ url: url }, (tab) => {
            chrome.windows.update(tab.windowId, { focused: true }, resolve);
        });
    });
}

export default {
    options: (route) => {
        const path = `${manifest.options_page}${route ? `#/${route}`: ""}`;
        const url = chrome.extension.getURL(path);
        // await openExtensionPage(url);
        console.error(`Refactoring in Progress.
TODO: Open extension URL '${url}' from Service Worker`);
    },
};
