
import { writable } from "svelte/store";
import { events } from "../background/pomodoro_store";
import { pomodoro_client } from "./client";

let pomodoro = writable({});

(async function init() {
    pomodoro.set(await pomodoro_client.get_status())
})()

Object.values(events).forEach(event =>{
    pomodoro_client.on(event, state => pomodoro.set(state))
})

export function timer_readable() {
    return { 
        subscribe: pomodoro.subscribe,
        start: function () {
            return pomodoro_client.start();
        },
        stop: function () {
            return pomodoro_client.stop();
        },
        pause: function () {
            return pomodoro_client.pause();
        },
        resume: function () {
            return pomodoro_client.resume();
        },
        restart: function () {
            return pomodoro_client.restart();
        },
        restart_cycle: function () {
            return pomodoro_client.start_cycle();
        },
    }
}
