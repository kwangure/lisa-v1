
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
            pomodoro_client.start();
        },
        stop: function () {
            pomodoro_client.stop();
        },
        pause: function () {
            pomodoro_client.pause();
        },
        resume: function () {
            pomodoro_client.resume();
        },
        restart_timer: function () {
            pomodoro_client.restart();
        },
        restart_cycle: function () {
            pomodoro_client.start_cycle();
        },
    }
}
