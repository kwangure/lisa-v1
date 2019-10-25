import {events, phases} from "./pomodoro_store"

export default function notification (pomodoro) {
    let pomodoro_state = pomodoro.get_status();
    
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
        messages.push(`${count} Pomodoro ${count > 1 ?'s':''} Until Long Break`);
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
    
    let permission = (async () => {
        let result = await (new Promise((resolve)=>{ 
            chrome.notifications.getPermissionLevel(level=> {
                resolve(level)
            })
        }));
        return result;
    })();

    //if(permission == chrome.notifications.PermissionLevel.GRANTED) {
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
            console.log("n_id", notification_id);
            if(transition == events.START) {
                chrome.notifications.clear(notification_id);
                unsubscribe();
            }
        });

        chrome.notifications.onClicked.addListener(clicked);
        chrome.notifications.onButtonClicked.addListener(button_clicked);
        chrome.notifications.onClosed.addListener(closed);
    //}
};