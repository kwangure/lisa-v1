/* global chrome */
import { events, phases } from "./pomodoro_store";

async function readBinary(file) {
    // @ts-ignore
    let url = chrome.runtime.getURL(file);
    let response = await fetch(url);
    return await response.arrayBuffer();
}

async function play(filename) {
    if (!filename && filename !== "none") {
        return;
    }

    // We use AudioContext instead of Audio since it works more
    // reliably in different browsers (Chrome, FF, Brave).
    let context = new AudioContext();

    let source = context.createBufferSource();
    source.connect(context.destination);
    source.buffer = await new Promise(async (resolve, reject) => {
        let content = await readBinary(filename);
        context.decodeAudioData(content, buffer => resolve(buffer), error => reject(error));
    });

    await new Promise(resolve => {
        // Cleanup audio context after sound plays.
        source.onended = () => {
            context.close();
            resolve();
        };
        source.start();
    });
}

let notifications = new Map();
let pomodoro = null;

async function notify(pomodoro_state, settings) {
    let title = {
        [phases.FOCUS]: "Start focusing",
        [phases.SHORT_BREAK]: (
            pomodoro_state.has_long_break
                ? "Take a short break"
                : "Take a break"
        ),
        [phases.LONG_BREAK]: "Take a long break",
    }[pomodoro_state.next_phase];

    let messages = [];
    let count = pomodoro_state.pomodoros_until_long_break;

    if (count > 0) {
        messages.push(`${count} pomodoro${count > 1 ? "s" : ""} until long break`);
    }

    let message = messages.join("\n");

    let buttonText = {
        [phases.FOCUS]: "Start focusing now",
        [phases.SHORT_BREAK]: (
            pomodoro_state.has_long_break
                ? "Start short break now"
                : "Start break now"
        ),
        [phases.LONG_BREAK]: "Start long break now",
    }[pomodoro_state.next_phase];

    let buttons = [
        { title: buttonText },
    ];

    let options = {
        type: "basic",
        title,
        message,
        iconUrl: "images/browser-action.png",
        buttons,
        requireInteraction: true,
    };

    let notification_id = "pomodoro-notification";
    // @ts-ignore
    chrome.notifications.create(notification_id, options, notification_id => {
        play(settings.sound);
        notifications.set(notification_id, notification_id);
    });

    let clicked = id => {
        // @ts-ignore
        chrome.notifications.clear(id, was_cleared => {
            if (was_cleared) {
                pomodoro.start();
            }
        });
    };

    let button_clicked = id => {
        // @ts-ignore
        chrome.notifications.clear(id, was_cleared => {
            if (was_cleared) {
                pomodoro.start();
            }
        });
    };

    let closed = id => {
        if (id !== notification_id) {
            return;
        }
        // @ts-ignore
        chrome.notifications.onClicked.removeListener(clicked);
        // @ts-ignore
        chrome.notifications.onButtonClicked.removeListener(button_clicked);
        // @ts-ignore
        chrome.notifications.onClosed.removeListener(closed);
    };

    // @ts-ignore
    chrome.notifications.onClicked.addListener(clicked);
    // @ts-ignore
    chrome.notifications.onButtonClicked.addListener(button_clicked);
    // @ts-ignore
    chrome.notifications.onClosed.addListener(closed);
}

function clearNotifications(_pomodoro_state, pomodoro_store) {
    pomodoro = pomodoro_store;
    notifications.forEach(notification_id => {
        // @ts-ignore
        chrome.notifications.clear(notification_id);
    });
}

export default new Map([
    [events.EXPIRE, (pomodoro_state, pomodoro_store) => {
        clearNotifications();
        pomodoro = pomodoro_store;
        let phase = pomodoro_state.phase;
        let notification_settings = pomodoro_state.settings[phase].notifications;

        if (notification_settings.desktop) {
            notify(pomodoro_state, notification_settings);
        }
    }],
    [events.START, clearNotifications],
    [events.EXTEND, clearNotifications],
]);