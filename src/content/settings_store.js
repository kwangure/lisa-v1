
import { writable } from "svelte/store";
import { events } from "../background/pomodoro_store";
import { settings_client } from "../client";

let settings = writable({});

(async function init() {
    settings.set(await settings_client.get());
})()

settings_client.on("settings-change", state => settings.set(state))

export function settings_writable() {
    return { 
        subscribe: settings.subscribe,
        set: function (state) {
            settings_client.set(state);
        },
        update: async function (update_fn) {
            let state = update_fn(await this.get());
            settings_client.set(state)
        },
        get: function () {
            return settings_client.get();
        },
        reset: function () {
            return settings_client.reset();
        },
        stop: function () {
            return settings_client.stop();
        },
        pause: function () {
            return settings_client.pause();
        },
        resume: function () {
            return settings_client.resume();
        },
        restart_timer: function () {
            return settings_client.restart();
        },
        restart_cycle: function () {
            return settings_client.start_cycle();
        },
    }
}
