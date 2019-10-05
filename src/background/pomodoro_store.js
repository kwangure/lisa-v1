import { writable } from "./store";

function noop() {}

const states = {
    STOPPED: "stopped",
    RUNNING: "running",
    PAUSED: "paused",
}

const phases = {
    FOCUS: "focus",
    SHORT_BREAK: "short-break",
    LONG_BREAK: "long-break",
};

const events = {
    START: "start",
    STOP: "stop",
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
    EVENTS: enumerate_with_word(events, "or"),
    STATES: enumerate_with_word(states, "or"),
};

const errors = {
    ELAPSED_GT_DURATION: "Elapsed cannot be greater than total duration.",
    INVALID_EVENT: "Event is not one of: " + enumerations.EVENTS,
    INVALID_EVENTS: "An event is not one of: " + enumerations.EVENTS,
    INVALID_EVENT_LISTENER: "Event listener must be a function",
    INVALID_PHASE: "Phase is not one of: " + enumerations.PHASES,
    INVALID_STATE: "State is not one of: " + enumerations.STATES,
    NO_LONG_BREAK_INTERVAL: "No long break interval defined.",
    VALUE_NEGATIVE: "Value cannot be negative.",
};

export function pomodoro_store(timer, settings_readable){
    let pomodoro = {};

    Object.defineProperties(pomodoro, {
        pomodoros_since_start: {
            value: 0,
            writable: true,
        },
        settings: {
            get: function(){
                return settings_readable.get()
            }
        },
        duration: {
            get: function () {
                return {
                    [phases.FOCUS]: this.settings.focus_duration,
                    [phases.SHORT_BREAK]: this.settings.short_break_duration,
                    [phases.LONG_BREAK]: this.settings.long_break_duration,
                } [this.phase];
            }
        },
        _extended_duration: {
            value: 0,
            writable: true,
        },
        extended_duration: {
            get: function () {
                return this._extended_duration;
            },
            set: function (duration) {
                if (value < 0) {
                    throw new Error(errors.VALUE_NEGATIVE);
                }
                this._extended_duration = duration;
            },
        },
        total_duration: {
            get: function () {
                return this.duration + this.extended_duration;
            },
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
                if (value > this.total_duration) {
                    throw new Error(errors.ELAPSED_TOO_LARGE);
                }
                return this._elapsed;
            }
        },
        remaining: {
            get: function () {
                return this.total_duration - this.elapsed;
            }
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
            }
        },
        status: {
            get: function () {
                return {
                    phase: this.phase,
                    next_pase: this.next_phase,
                    duration: this.duration,
                    elapsed: this.elapsed,
                    remaining: this.remaining,
                    state: this.state,
                }
            }
        },
        is_running: {
            get: function () {
                return this.state == states.RUNNING;
            }
        },
        is_paused: {
            get: function () {
                return this.state == states.PAUSED;
            }
        },
        is_stopped: {
            get: function () {
                return this.state == states.STOPPED;
            }
        },
        has_long_break: {
            qet: function () {
                return this.settings.long_break.interval > 0;
            }
        },
        pomodoros_until_long_break: {
            get: function () {
                let interval = this.settings.long_break;
                if (!interval) {
                    return null;
                }

                return interval - ((this.pomodoros - 1) % interval) - 1;
            }
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
                if (Object.values(phases).includes(new_phase)) {
                    throw new Error(errors.INVALID_PHASE);
                }
                if (!this.has_long_break && new_phase == phases.LONG_BREAK) {
                    throw new Error(errors.NO_LONG_BREAK_INTERVAL);
                }
                if(new_phase == phases.FOCUS){
                    this.pomodoros_since_start = 0
                }
                this._phase = new_phase;
            }
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
            }
        },
    })

    function objectMap(obj, callback) {
        var result = {};
        Object.keys(obj).forEach(function (obj_key) {
            let { key, value } = callback(obj, obj_key, obj[obj_key]);
            result[key] = value
        });
        
        return result;
    }

    function isSubset(array_1, array_2) {
        return array_1.every(value => array_2.includes(value));
    }

    function call_all(fns, event_name) {
        fns.forEach(fn => fn(event_name));
    }

    let pomodoro_store = writable(pomodoro);
    pomodoro_store.subscribe(value => {
        pomodoro = value;
    })
    let subscribers = objectMap(events, (_events, _event_key, event_name) => {
        return { key: event_name, value: []};
    });

    let actions = {
        subscribe: function (event, event_listener) {
            if (typeof event == 'string' && !Object.values(events).includes(event)) {
                throw new Error(errors.INVALID_EVENT);
            }
            if (typeof event == 'array' && !isSubset(event, Object.values(events))) {
                throw new Error(errors.INVALID_EVENTS);
            }
            if (typeof event_listener != 'function') {
                throw new Error(errors.INVALID_EVENT_LISTENER);
            }
            subscribers[event].push(event_listener)
        },
        get_status: function(){
            return pomodoro.status
        },
        start_cycle: function () {
            pomodoro_store.update(state => {
                state.pomodoros = 0;
                state.phase = phases.FOCUS;
                return state;
            })
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
                status.elapsed = 0;
                status.state = states.RUNNING;
                this.subscribe_to_timer()
                return status
            })
            call_all(subscribers[events.START], events.START)
        },
        stop: function () {
            pomodoro_store.update(status => {
                status.elapsed = 0;
                status.state = states.RUNNING;
                this.unsubscribe_from_timer()
                return status
            })
            call_all(subscribers[events.STOP], events.STOP)
        },
        restart: function () {
            this.stop()
            this.start()
        },
        pause: function () {
            pomodoro_store.update(status => {
                status.state = states.PAUSED;
                return status;
            })
            call_all(subscribers[events.PAUSE], events.PAUSE)
        },
        resume: function () {
            pomodoro_store.update(status => {
                status.state = states.RUNNING;
                return status;
            })
            call_all(subscribers[events.RESUME], events.RESUME)
        },
        extend: function (duration) {
            pomodoro_store.update(state => {
                state.duration = duration;
            })
            call_all(subscribers[events.EXTEND], events.EXTEND)
        },
        tick: function () {
            pomodoro_store.update(status => {
                switch (status.state) {
                    case states.PAUSED:
                        return status;
                    case states.STOPPED:
                        timer_store && timer_store.unsubscribe();
                        return status;
                    case states.RUNNING && status.remaining == 0:
                        this.stop()
                        return status;
                    default: // states.RUNNING
                        status.elapsed += 1
                }
                return status
            })
            call_all(subscribers[events.TICK], events.TICK)
        },
        subscribe_to_timer: function () {
            let unsubscribe = timer.subscribe(() => {
                this.tick()
            })
            this.unsubscribe_from_timer = function () {
                unsubscribe()
                this.unsubscribe_from_timer = noop
            }
        },
        unsubscribe_timer: noop
    }

    return actions
}

export { states, phases, events }