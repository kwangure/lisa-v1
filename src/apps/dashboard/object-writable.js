import compare from "just-compare";
import { watch } from "proxy-watcher";

function noop() {}

const subscriberQueue = [];

/**
 * Create a `Writable` store that allows both updating and reading by subscription.
 * @param {=} value initial value
 * @param {StartStopNotifier=} start start and stop notifications for subscriptions
 */
export function writable(value, start = noop) {
    let stop;
    const subscribers = [];

    let [proxy, dispose] = watch(value, callSubscribers);

    function callSubscribers() {
        const runQueue = !subscriberQueue.length;
        for (let i = 0; i < subscribers.length; i += 1) {
            const s = subscribers[i];
            s[1]();
            subscriberQueue.push(s, value);
        }
        if (runQueue) {
            for (let i = 0; i < subscriberQueue.length; i += 2) {
                subscriberQueue[i][0](subscriberQueue[i + 1]);
            }
            subscriberQueue.length = 0;
        }
    }

    function set(newValue) {
        if (!compare(value, newValue)) {
            value = newValue;
            dispose();
            [proxy, dispose] = watch(value, callSubscribers);
            if (stop) { // store is ready
                callSubscribers();
            }
        }
    }

    function get() {
        return proxy;
    }

    function update(fn) {
        set(fn(proxy));
    }

    function subscribe(run, invalidate = noop) {
        const subscriber = [run, invalidate];
        subscribers.push(subscriber);
        if (subscribers.length === 1) {
            stop = start(set) || noop;
        }
        run(proxy);

        return () => {
            const index = subscribers.indexOf(subscriber);
            if (index !== -1) {
                subscribers.splice(index, 1);
            }
            if (subscribers.length === 0) {
                stop();
                stop = null;
            }
        };
    }

    return { get, set, update, subscribe };
}
