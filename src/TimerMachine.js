import {
    Machine,
    interpret
} from 'xstate';

const timerStates = {
    initial: 'running',
    context: {
        remaining: 0,
        elapsed: 0,
        duration: 0,
    },
    states: {
        running: {
            on: { PAUSE: 'paused' },
        },
        paused: {
            on: { RESUME: 'running' }
        },
    },
};

function isLongBreakNext(context) {
    return context.hasLongBreak && 
    context.pomodorosUntilLongBreak == 0
}

const pomodoroStates = {
    initial: 'focus',
    context: {
        settings: {
            focus: 25,
            longBreak: 15,
            shortBreak: 5,
        },
        pomodorosTillLongBreak: 4,
    },
    states: {
        focus: {
            on: {
                NEXT_PHASE: [
                    { target: 'longBreak', cond: isLongBreakNext },
                    { target: 'shortBreak' },
                ]
            },
            ...timerStates
        },
        shortBreak: {
            on: {
                NEXT_PHASE: 'focus',
                
            },
            ...timerStates
        },
        longBreak: {
            on: {
                NEXT_PHASE: 'focus'
            },
            ...timerStates
        },
    },
}

const pomodoroMachine = Machine(
    {
        id: 'pomodoro',
        initial: 'inactive',
        states: {
            inactive: {
                on: {
                    START: 'active'
                },
            },
            active: {
                on: {
                    STOP: 'inactive'
                },
                ...pomodoroStates
            },
        },
    }, 
    {
        actions: {
     
        }
    }, 
);

const pomodoroService = interpret(pomodoroMachine);

export { pomodoroService } ;