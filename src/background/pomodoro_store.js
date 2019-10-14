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
    EVENTS: enumerate_with_word(events, "or"),
    STATES: enumerate_with_word(states, "or"),
};

const errors = {
    ELAPSED_GT_DURATION: "Elapsed cannot be greater than total duration.",
    INVALID_EVENT: "Event is not one of: " + enumerations.EVENTS,
    INVALID_EVENT_LISTENER: "Event listener must be a function",
    INVALID_PHASE: "Phase is not one of: " + enumerations.PHASES,
    INVALID_STATE: "State is not one of: " + enumerations.STATES,
    NO_LONG_BREAK_INTERVAL: "No long break interval defined.",
    VALUE_NEGATIVE: "Value cannot be negative.",
};

export function pomodoro_store(timer, settings_readable){
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
                return settings_readable.get()
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
                return this._extended_duration;
            },
            set: function (duration) {
                if (value < 0) {
                    throw new Error(errors.VALUE_NEGATIVE);
                }
                if (value > this.total_duration) {
                    throw new Error(errors.ELAPSED_GT_DURATION);
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
                if(new_phase == phases.FOCUS){
                    this.pomodoros_since_start = 0
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
    })

    function objectMap(obj, callback) {
        var result = {};
        Object.keys(obj).forEach(function (obj_key) {
            let { key, value } = callback(obj, obj_key, obj[obj_key]);
            result[key] = value
        });
        
        return result;
    }

    let pomodoro_store = writable(pomodoro);
    pomodoro_store.subscribe(value => {
        pomodoro = value;
    })
    let subscribers = objectMap(events, (_events, _event_key, event_name) => {
        return { key: event_name, value: []};
    });
    function emit(event_name) {
        let fns = subscribers[event_name];
        let event_msg = {
            event_name,
            ...pomodoro
        };
        fns.forEach(fn => fn(event_msg));
    }

    let actions = {
        subscribe: function (event, event_listener) {
            if (typeof event_listener != 'function') {
                throw new Error(errors.INVALID_EVENT_LISTENER);
            }
            if (Array.isArray(event)) {
                event.forEach(e => this.subscribe(e, event_listener))
            }
            if (typeof event == 'string') {
                if(Object.values(events).includes(event)){
                    subscribers[event].push(event_listener)
                } else {
                    throw new Error(errors.INVALID_EVENT);
                }
            }
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
                return status
            })
            this.subscribe_to_timer()
            emit(events.START)
        },
        stop: function () {
            pomodoro_store.update(status => {
                status.elapsed = 0;
                status.pomodoros_since_start = 0;
                status.state = states.STOPPED; 
                status.phase = phases.FOCUS;
                return status
            })
            this.unsubscribe_from_timer()
            emit(events.STOP)
        },
        // Avoid calling expire directly. It should be system only
        // Use `stop` instead.
        expire: function () {
            pomodoro_store.update(status => {
                status.previous_phase = status.phase;
                status.pomodoros_since_start += 1;
                status.state = states.STOPPED;
                return status
            })
            this.unsubscribe_from_timer()
            emit(events.EXPIRE)
        },
        restart: function () {
            pomodoro_store.update(status => {
                status.elapsed = 0;
                return status
            })
        },
        pause: function () {
            pomodoro_store.update(status => {
                status.state = states.PAUSED;
                return status;
            })
            emit(events.PAUSE)
        },
        resume: function () {
            pomodoro_store.update(status => {
                status.state = states.RUNNING;
                return status;
            })
            emit(events.RESUME)
        },
        extend: function (duration) {
            pomodoro_store.update(state => {
                state.duration = duration;
            })
            emit(events.EXTEND)
        },
        tick: function () {
            pomodoro_store.update(status => {
                switch (status.state) {
                    case states.PAUSED:
                        return status;
                    case states.STOPPED:
                        return status;
                    case states.RUNNING:
                        if(status.remaining == 0){
                            this.expire();
                        } else {
                            status.elapsed += 1
                        }
                        return status; 
                }
                return status
            })
            emit(events.TICK)
        },
        subscribe_to_timer: function () {
            let unsubscribe = timer.subscribe(() => {
                this.tick()
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

export { states, phases, events }