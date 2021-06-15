import uid from "uid";

export function chromeSetInterval(func, delayInMilliseconds, ...args) {
    const name = uid();
    const SECOND = 1000;
    const MINUTE = 60 * SECOND;

    chrome.alarms.create(name, {
        periodInMinutes: delayInMilliseconds/MINUTE,
    });

    chrome.alarms.onAlarm.addListener((alarmInfo) => {
        if (alarmInfo.name === name) func(...args);
    });

    return name;
}

export function chromeClearInterval(id) {
    chrome.alarms.clear(id);
}
