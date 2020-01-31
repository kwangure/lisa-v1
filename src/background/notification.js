import {events, phases} from "./pomodoro_store"

async function readBinary(file) {
    let url = chrome.runtime.getURL(file);
    let response = await fetch(url);
    return await response.arrayBuffer();
}

async function play(filename) {
    if (!filename) {
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
      }
      source.start();
    });
  }

async function notify(pomodoro, pomodoro_state, settings) {
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
        messages.push(`${count} pomodoro${count > 1 ?'s':''} until long break`);
    }

    /*let pomodorosToday = await this.history.countToday();
    messages.push(M.pomodoros_completed_today(pomodoroCount(pomodorosToday)));*/
    let message = messages.join("\n");

    let buttonText = {
        [phases.FOCUS]: "Start focusing now",
        [phases.SHORT_BREAK]: (
            pomodoro_state.has_long_break 
                ? "Start short break now"
                : "Start break now"
        ),
        [phases.LONG_BREAK]: "Start long break now"
    }[pomodoro_state.next_phase];

    let action = {
        [phases.FOCUS]: "Start focusing",
        [phases.SHORT_BREAK]: (
            pomodoro_state.has_long_break 
                ? "Start short break"
                : "Start break"
        ),
        [phases.LONG_BREAK]: "Start long break"
    }[pomodoro_state.next_phase];

    let buttons =  [
        { title: buttonText },
    ]

    let options = {
        type: "basic",
        title,
        message,
        iconUrl: "images/browser-action.png",
        buttons
    };

    let notification_id = 'pomodoro-notification'
    chrome.notifications.create('pomodoro-notification', options, ()=>{});

    let clicked = id => {
        if (id !== notification_id) {
            return;
        }
        pomodoro.start();
        chrome.notifications.clear(notification_id);
    }

    let button_clicked = (id, button_index) => {
        if (id !== notification_id) {
            return;
        }
        pomodoro.start();
        chrome.notifications.clear(notification_id);
    };
    
    let closed = id => {
        if (id !== notification_id) {
            return;
        }
        chrome.notifications.onClicked.removeListener(clicked);
        chrome.notifications.onButtonClicked.removeListener(button_clicked);
        chrome.notifications.onClosed.removeListener(closed);
    };

    let unsubscribe = ()=>{};
    unsubscribe = pomodoro.subscribe(value => {
        const { transition } = value;
        if(transition == events.START) {
            chrome.notifications.clear(notification_id);
            unsubscribe();
        }
    });

    chrome.notifications.onClicked.addListener(clicked);
    chrome.notifications.onButtonClicked.addListener(button_clicked);
    chrome.notifications.onClosed.addListener(closed);
}

export default function notification (pomodoro) {
    let pomodoro_state = pomodoro.get_status();
    let phase = pomodoro_state.phase;
    let settings = pomodoro_state.settings[phase].notifications;
    
    if(settings.desktop){
        notify(pomodoro, pomodoro_state, settings);
    }
};