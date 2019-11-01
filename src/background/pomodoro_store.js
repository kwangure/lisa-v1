import { writable } from "./store";

function noop() {}

const states = {
    STOPPED: "stopped",
    RUNNING: "running",
    PAUSED: "paused",
}

const phases = {
    FOCUS: "focus",
    SHORT_BREAK: "short_break",
    LONG_BREAK: "long_break",
};

const transitions = {
    START: "start",
    STOP: "stop",
    EXPIRE: "expire",
    PAUSE: "pause",
    RESUME: "resume",
    EXTEND: "extend",
    TICK: "tick",
};

function enumerate_with_word(object, word) {
    let values = Object.values(object);
    let all_but_last = values.slice(0, -1);
    let last = values.pop();
    return `${all_but_last.join(", ")} ${word} ${last}`;
}

const enumerations = {
    PHRASES: enumerate_with_word(phases, "or"),
    TRANSITIONS: enumerate_with_word(transitions, "or"),
    STATES: enumerate_with_word(states, "or"),
};

const errors = {
    ELAPSED_GT_DURATION: "Elapsed cannot be greater than total duration.",
    INVALID_TRANSITION: "Transition is not one of: " + enumerations.TRANSITIONS,
    INVALID_SUBSCRIBER: "Subscriber must be a function",
    INVALID_PHASE: "Phase is not one of: " + enumerations.PHASES,
    INVALID_STATE: "State is not one of: " + enumerations.STATES,
    NO_LONG_BREAK_INTERVAL: "No long break interval defined.",
    VALUE_NEGATIVE: "Value cannot be negative.",
};

export function pomodoro_readable(timer, settings){
    let pomodoro = {
        // Useful for checking if current phase is the first pomodoro
        previous_phase: null,
    };

    Object.defineProperties(pomodoro, {
        pomodoros_since_start: {
            value: 0,
            writable: true,
            enumerable: true,
        },
        settings: {
            get: function(){
                return settings.get();
            },
            enumerable: true,
        },
        duration: {
            get: function () {
                return {
                    [phases.FOCUS]: this.settings.focus.duration,
                    [phases.SHORT_BREAK]: this.settings.short_break.duration,
                    [phases.LONG_BREAK]: this.settings.long_break.duration,
                } [this.phase] * 60;
            },
            enumerable: true,
        },
        _extended_duration: {
            value: 0,
            writable: true,
        },
        extended_duration: {
            get: function () {
                return this._extended_duration * 60;
            },
            set: function (duration) {
                if (duration < 0) {
                    throw new Error(errors.VALUE_NEGATIVE);
                }
                this._extended_duration = duration;
            },
            enumerable: true,
        },
        total_duration: {
            get: function () {
                return this.duration + this.extended_duration;
            },
            enumerable: true,
        },
        _elapsed: {
            value: 0,
            writable: true,
        },
        elapsed: {
            get: function () {
                return this._elapsed;
            },
            set: function (value) {
                if (value < 0) {
                    throw new Error(errors.VALUE_NEGATIVE);
                }
                this._elapsed = value;
            },
            enumerable: true,
        },
        remaining: {
            get: function () {
                return this.total_duration - this.elapsed;
            },
            enumerable: true,
        },
        _state: {
            value: states.STOPPED,
            writable: true,
        },
        state: {
            get: function () {
                return this._state;
            },
            set: function (new_state) {
                if (!Object.values(states).includes(new_state)) {
                    throw new Error(errors.INVALID_STATE);
                }
                this._state = new_state;
            },
            enumerable: true,
        },
        is_running: {
            get: function () {
                return this.state == states.RUNNING;
            },
            enumerable: true,
        },
        is_paused: {
            get: function () {
                return this.state == states.PAUSED;
            },
            enumerable: true,
        },
        is_stopped: {
            get: function () {
                return this.state == states.STOPPED;
            },
            enumerable: true,
        },
        has_long_break: {
            get: function () {
                return this.settings.long_break.interval > 0;
            },
            enumerable: true,
        },
        pomodoros_until_long_break: {
            get: function () {
                let interval = this.settings.long_break;
                if (!interval) {
                    return null;
                }

                return interval - ((this.pomodoros - 1) % interval) - 1;
            },
            enumerable: true,
        },
        _phase: {
            value: phases.FOCUS,
            writable: true,
        },
        phase: {
            get: function () {
                return this._phase;
            },
            set: function (new_phase) {
                if (!Object.values(phases).includes(new_phase)) {
                    throw new Error(errors.INVALID_PHASE);
                }
                if (!this.has_long_break && new_phase == phases.LONG_BREAK) {
                    throw new Error(errors.NO_LONG_BREAK_INTERVAL);
                }
                this._phase = new_phase;
            },
            enumerable: true,
        },
        next_phase: {
            get: function () {
                if (this.phase == phases.SHORT_BREAK || this.phase == phases.LONG_BREAK) {
                    return phases.FOCUS;
                }

                if (!this.has_long_break) {
                    return phases.SHORT_BREAK;
                }

                if (this.pomodoros_until_long_break === 0) {
                    return phases.LONG_BREAK;
                } else {
                    return phases.SHORT_BREAK;
                }
            },
            enumerable: true,
        },
        _transition: {
            value: null,
            writable: true,
        },
        transition: {
            get: function () {
                return this._transition;
            },
            set: function (transition) {
                if (!Object.values(transitions).includes(transition)) {
                    throw new Error(errors.INVALID_TRANSITION);
                }
                this._transition = transition;
            },
        }
    })

    let pomodoro_store = writable(pomodoro);

    pomodoro_store.subscribe(value => {
        pomodoro = value;
    })

    let actions = {
        subscribe: function(subscriber){
            if (typeof subscriber != 'function') {
                throw new Error(errors.INVALID_SUBSCRIBER);
            }
            return pomodoro_store.subscribe(subscriber)
        },
        get_status: function(){
            return pomodoro
        },
        start_cycle: function () {
            this.stop()
            this.start()
        },
        start_focus: function () {
            pomodoro_store.update(state => {
                state.phase = phases.FOCUS;
                return state;
            })
            this.start();
        },
        start_short_break: function () {
            pomodoro_store.update(state => {
                state.phase = phases.SHORT_BREAK;
                return state;
            })
            this.start();
        },
        start_long_break: function () {
            pomodoro_store.update(state => {
                state.phase = phases.LONG_BREAK;
                return state;
            })
            this.start();
        },
        start: function () {
            pomodoro_store.update(status => {
                if(status.previous_phase){
                    status.previous_phase = status.phase;
                    status.phase = status.next_phase;
                }
                status.elapsed = 0;
                status.state = states.RUNNING;
                status.transition = transitions.START;
                return status
            })
            this.subscribe_to_timer();
        },
        stop: function () {
            pomodoro_store.update(status => {
                status.elapsed = 0;
                status.pomodoros_since_start = 0;
                status.state = states.STOPPED; 
                status.previous_phase = null;
                status.phase = phases.FOCUS;
                status.transition = transitions.STOP;
                return status
            })
            this.unsubscribe_from_timer()
        },
        // Avoid calling expire directly. It should be system only
        // Use `stop` instead.
        expire: function () {
            pomodoro_store.update(status => {
                status.previous_phase = status.phase;
                status.pomodoros_since_start += 1;
                status.state = states.STOPPED;
                status.extended_duration = 0;
                status.transition = transitions.EXPIRE;
                return status
            })
            this.unsubscribe_from_timer()
        },
        restart: function () {
            pomodoro_store.update(status => {
                status.elapsed = 0;
                status.state = states.RUNNING;
                status.transition = transitions.START;
                return status
            })
        },
        pause: function () {
            if(pomodoro.state != states.RUNNING) return;
            pomodoro_store.update(status => {
                status.state = states.PAUSED;
                status.transition = transitions.PAUSE;
                return status;
            })
        },
        resume: function () {
            if(pomodoro.state != states.PAUSED) return;
            pomodoro_store.update(status => {
                status.state = states.RUNNING;
                status.transition = transitions.RESUME;
                return status;
            })
        },
        extend: function (duration) {
            pomodoro_store.update(status => {
                status.extended_duration = duration; 
                status.phase = status.previous_phase;
                status.pomodoros_since_start -= 1;
                status.state = states.RUNNING;
                status.transition = transitions.EXTEND;
                return status;
            });
            this.subscribe_to_timer();
        },
        tick: function () {
            if(pomodoro.remaining == 0) {
                this.expire();
            } else if (pomodoro.state == states.RUNNING) {
                pomodoro_store.update(status => {
                    status.elapsed += 1
                    status.transition = transitions.TICK;
                    return status
                });
            }
        },
        subscribe_to_timer: function () {
            this.unsubscribe_from_timer();

            let unsubscribe = timer.subscribe(() => {
                this.tick();
            })
            
            this.unsubscribe_from_timer = function () {
                unsubscribe();
                this.unsubscribe_from_timer = noop;
            }
        },
        unsubscribe_from_timer: noop
    }

    return actions
}

export { states, phases, transitions as events }