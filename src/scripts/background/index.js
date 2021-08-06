chrome.runtime.onStartup.addListener(() => {
    const url = chrome.runtime.getURL("dashboard/index.html");
    chrome.tabs.create({ url: url }, (tab) => {
        chrome.windows.update(tab.windowId, { focused: true });
    });
});
