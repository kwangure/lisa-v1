import {
    Machine,
    interpret,
    assign
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
    return context && context.hasLongBreak && 
    context.pomodorosUntilLongBreak == 0
}

const pomodoroStates = {
    initial: 'focus',
    states: {
        focus: {
            on: {
                NEXT_PHASE: [
                    { 
                        target: 'longBreak', 
                        cond: 'isLongBreakNext',
                        actions: ['activate'] 
                    },
                    { 
                        target: 'shortBreak', 
                        actions: ['activate']
                    },
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

const decr = assign({
    pomodorosUntilLongBreak : (context) => {
        debugger
        return (context.pomodorosUntilLongBreak + (4 - 1)) % 4;
    },
})

const pomodoroMachine = Machine(
    {
        id: 'pomodoro',
        initial: 'inactive',
        context: {
            settings: {
                focus: 25,
                longBreak: 15,
                shortBreak: 5,
            },
            hasLongBreak: true,
            pomodorosUntilLongBreak: 4,
        },
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
        guards: {
            isLongBreakNext: (context) => {
                console.log('context', context)
                console.log('hasLongBreak', context.hasLongBreak)
                console.log('pomsTilBreak', context.pomodorosUntilLongBreak)
                return context && context.hasLongBreak && 
                context.pomodorosUntilLongBreak == 0
            }
        }
    },
    {
        actions: {
            // action implementations
            activate: (context, event) => {
                console.log('activating...');
            },
            notifyActive: (context, event) => {
                console.log('active!');
            },
            notifyInactive: (context, event) => {
                console.log('inactive!');
            },
            sendTelemetry: (context, event) => {
                console.log('time:', Date.now());
            }
        }
    }
);

const pomodoroService = interpret(pomodoroMachine);

export { pomodoroService } ;