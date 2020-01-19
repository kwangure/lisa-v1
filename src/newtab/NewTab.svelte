<script>
    import { Button } from "@deimimi/strawberry";
    import { mdiHistory, mdiSettings } from "@mdi/js";
    import { timer_readable } from "../content/timer_store";
    import { mmss } from "../content/utils";
    import { phases } from "../background/pomodoro_store";
    import { onDestroy, onMount } from "svelte";
    import { mdiPlayOutline, mdiRestart, mdiPause } from "@mdi/js";

    let clock;

    (function show_time() {
        let date = new Date();
        let hours = date.getHours();
        let minutes = date.getMinutes();
        let session = hours > 11 ? "pm": "am";
        
        hours = hours == 0 ? 12 : hours;
        hours = hours > 12 ? hours - 12: hours;
        minutes = (minutes < 10) ? "0" + minutes : minutes;

        clock = `${hours}:${minutes} ${session}`;

        setTimeout(show_time, 1000);
    })()

    function rand_between(min, max) { // min and max included 
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    let timer = timer_readable();
    const { start, stop, pause, resume, restart_cycle, restart_timer } = timer;

    $: time = mmss(($timer && $timer.remaining)|| 0);
    
    $: next_phase_text = (()=> {
        if(!$timer.previous_phase) {
            return "Start focusing"
        }
        return {
            null: '',
            [phases.FOCUS]: "Start focusing",
            [phases.SHORT_BREAK]: $timer.has_long_break ? "Take a short break" : "Take a break",
            [phases.LONG_BREAK]: "Take a long break"
        }[$timer.next_phase];
    })()
</script>

<div class="main" 
    style="background-image: url('../images/newtab/{rand_between(1, 30)}.webp');">
    <div class="header">
        <div class="clock">{clock}</div>
    </div>
    <div class="content">
        <div class="timer">
            <div class="time" class:paused={$timer.is_paused}>
                { time }
            </div>
            <div class="controls-wrapper">
                <div class="controls">
                    {#if $timer.is_paused}
                        <Button class="action" icon={mdiRestart} on:click={restart_timer}/>
                        <Button class="action" icon={mdiPlayOutline}
                            on:click={ resume }/>
                    {:else if $timer.is_running}
                        <Button class="action" icon={mdiPause} on:click={pause}/>
                    {:else if $timer.is_stopped }
                        <Button class="action text" icon={mdiPlayOutline}
                            on:click={ start }>
                            { next_phase_text }
                        </Button>
                        <Button class="action text" icon={mdiRestart} on:click={restart_cycle}>
                            Restart Pomodoro Cycle
                        </Button>
                    {/if}
                </div>
            </div>
        </div>
        <div class="actions-wrapper">
            <!--div class="actions">
                <Button class="settings action" icon={mdiSettings}
                    on:click={showSettings}/>
                <Button class="history action" icon={mdiHistory}
                    on:click={showHistory}/>
            </div-->
        </div>
    </div>
</div>

<style>
    @import "@deimimi/strawberry/css/strawberry.css";
    .main {
        display: flex;
        flex-direction: column;
        height: 100%;
        background-color: #666;
        color:#fff;
        background-size: cover;
        background-repeat: no-repeat;
        background-position-x: center;
        background-position-y: center;
        background-attachment: fixed;
        background-blend-mode: overlay;
        padding: 20px 50px;
    }
    .header,
    .content {
        display: flex;
    }
    .content {
        flex-direction: column;
        flex: auto;
    }
    .clock {
        margin-left: auto;
    }
    .timer {
        margin-left: auto;
    }
    .actions-wrapper{
        margin-top: auto;
    }
    .actions {
        margin-left: auto;
    }
    .actions :global(button.action){
        background-color: transparent;
        color: #fff;
        border: none !important;
        height: auto;
    }
    .actions :global(button.action .button-prefix) {
        padding: 10px 5px;
    }
    .clock {
        font-size: 80px;
    }
    .timer {
        color:#fff;
    }
    .time {
        font-weight: 500;
        font-size: 200px;
        font-variant-numeric: tabular-nums;
        line-height: 1;
        margin-top: 30px;
    }
    @keyframes blink  {
        0% {
            opacity: 1;
        }
        60% {
            opacity: 1;
        }
        80% {
            opacity: 0;
        }
        100% {
            opacity: 0;
        }
    }
    .paused {
        animation: blink 1s linear infinite;
    }
    .controls-wrapper {
        display: flex;
    }
    .controls {
        margin-left: auto;
    }
    .controls :global(button.action){
        background-color: transparent;
        color: #fff;
        border-color: #fff !important;
        height: auto;
    }
    .controls :global(button.action .button-prefix) {
        padding: 10px 5px;
    }
    .controls :global(button.action.text){
        font-size: 18px;
    }
</style>