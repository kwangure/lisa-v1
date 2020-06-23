<script>
    import { timer_readable } from "./timer_store";
    import { phases } from "../background/pomodoro_store";
    import { Button, Input, Dropdown, Modal, Tooltip } from "@deimimi/strawberry";
    import {
        mdiDotsHorizontal,
        mdiPlayOutline,
        mdiPause,
        mdiPictureInPictureBottomRightOutline,
    } from "@mdi/js";
    import { onDestroy, onMount } from "svelte";
    import { mmss } from "./utils";

    let timer = timer_readable();
    let chrome = window.chrome;

    let timer_stopped_modal = null;
    let visible = true;
    let right = true;
    let pomodoros = [];
    let extend_timer_by = 5;

    function toggle_right(){
        right = !right;
    }

    let dropdownItems = [
        {
            value: "Restart pomodoro cycle",
            clickFn: timer.restart_cycle,
        },
        {
            value: "Restart current timer",
            clickFn: timer.restart,
        },
    ];

    const ARROW_LEFT = 37;
    const ARROW_UP = 38;
    const ARROW_RIGHT = 39;
    const ARROW_DOWN = 40;
    
    function onKeyDown(e) {
        if(!e.altKey || !e.shiftKey) return;
    
        if (e.keyCode == ARROW_LEFT) {
            right = false;
        } else if (e.keyCode == ARROW_UP) {
            visible = true;
        } else if (e.keyCode == ARROW_RIGHT) {
            right = true;
        } else if (e.keyCode == ARROW_DOWN) {
            visible = false;
        }
    }

    onMount(()=>{
        document.addEventListener("keydown", onKeyDown);
    });
    onDestroy(() => {
        document.removeEventListener("keydown", onKeyDown);
    });

    $: time = mmss(($timer && $timer.remaining)|| 0);

    $: timer_class = $timer.is_stopped? "stop" : {
        null: "",
        [phases.FOCUS]: "focus",
        [phases.SHORT_BREAK]: "break",
        [phases.LONG_BREAK]: "break",
    }[$timer.phase];
    $: next_phase_text = (()=> {
        if(!$timer.previous_phase) {
            return "Start focusing";
        }
        return {
            null: "",
            [phases.FOCUS]: "Start focusing",
            [phases.SHORT_BREAK]: $timer.has_long_break ? "Take a short break" : "Take a break",
            [phases.LONG_BREAK]: "Take a long break",
        }[$timer.next_phase];
    })();
    
    $: extend_phase_text = {
        null: "",
        [phases.FOCUS]: "Extend focus by",
        [phases.SHORT_BREAK]: "Extend short break by",
        [phases.LONG_BREAK]: "Extend long break by",
    }[$timer.phase];

    $: pomodoros.length = $timer.pomodoros_since_start || 0;

    let s = val => val == 1 ? "" : "s";
</script>

<svelte:options tag="lisa-timer"/>

<link rel="stylesheet" href={chrome.extension.getURL("css/content.css")}/>

{#if $timer && $timer.is_stopped}
    <Modal bind:this={timer_stopped_modal} visible={true} closable={false}>
        <div slot="content" class="content">
            <div class="pomodoro-wrapper">
                {#if pomodoros.length > 0}
                    <div>{$timer.pomodoros_since_start} focus interval{s($timer.pomodoros_since_start)} completed today</div>
                    <div class="pomodoros">
                        {#each pomodoros as pomodoro}
                            <span></span>
                        {/each}
                    </div>
                    {#if $timer.has_long_break && $timer.pomodoros_until_long_break > 0}
                        <div>
                            {$timer.pomodoros_until_long_break} more until long break.
                        </div>
                    {/if}
                {:else}
                    <div>
                        You haven't completed any focus intervals today. Get started!
                        <div class="emoji">
                            <img src={chrome.runtime.getURL("/images/rocket.png")} alt="rocket">
                        </div>
                    </div>
                {/if}
            </div>
            {#if $timer.previous_phase}
                <div class="timer-card">
                    {extend_phase_text}
                    <div class="input-wrapper">
                        <Input.Number value={extend_timer_by} min={1}
                            on:input={(event) => extend_timer_by = event.target.value}/>
                    </div>
                    { extend_timer_by == 1 ? "minute" : "minutes" }
                    <div class="extend">
                        <Button color="primary"
                            on:click={() => timer.extend(extend_timer_by * 60) }>
                            Extend
                        </Button>
                    </div>
                </div>
                <div class="separator">or</div>
            {/if}
            <div on:click={ timer.start } class="timer-card phase">
                {next_phase_text}
            </div>
        </div>
    </Modal>
{:else if visible }
    <div class="countdown {right? 'bottom-right':''}">
        <div class="main">
            <div class="timer">
                <div class="time {timer_class} {$timer.is_paused? 'paused':''}">
                    { time }
                </div>
                <div class="controls">
                    {#if $timer.is_paused}
                        <Tooltip label="Resume timer">
                            <Button on:click={timer.resume} icon={mdiPlayOutline} color="none"/>
                        </Tooltip>
                    {:else if $timer.is_running}
                        <Tooltip label="Pause timer">
                            <Button on:click={timer.pause} icon={mdiPause} color="none"/>
                        </Tooltip>
                    {:else if $timer.is_stopped}
                        <Tooltip label="Start timer">
                            <Button on:click={timer.start} icon={mdiPlayOutline} color="none"/>
                        </Tooltip>
                    {/if}
                    {#if right}
                        <Tooltip label="Move timer left">
                            <Button 
                                on:click={toggle_right} 
                                icon={mdiPictureInPictureBottomRightOutline}
                                iconProps={{flip: "horizontal"}}
                                color="none" 
                                class="action"/>
                        </Tooltip>
                    {:else}
                        <Tooltip label="Move timer right">
                            <Button 
                                on:click={toggle_right} 
                                icon={mdiPictureInPictureBottomRightOutline}
                                color="none" 
                                class="action"/>
                        </Tooltip>
                    {/if}
                    <Dropdown placement="topRight">
                        <div slot="button">
                            <Button color="none" icon={mdiDotsHorizontal}/>
                        </div>
                        {#each dropdownItems as item}
                            <Dropdown.Item on:click={item.clickFn}>
                                {item.value}
                            </Dropdown.Item>
                        {/each}
                    </Dropdown>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    @import "@deimimi/strawberry/src/css/shared.css";
    :host {
        font-size: 14px;
        font-family: var(--font);
    }
    .countdown,
    :global(.berry-modal) {
        --text: var(--grey-dark);
    }
    .countdown {
        position: fixed;
        bottom: 0px;
        left: 0px;
        padding: 20px 20px 28px 28px;
        background-color: transparent;
        font-size: 14px;
        font-family: --apple-system, Arial, Helvetica, sans-serif;
        z-index: 50001 !important;
        user-select: none;

    }
    .countdown.bottom-right {
        bottom: 0px;
        right: 0px;
        left: auto;
    }
    .main {
        display: flex;
        flex-direction: column;
        color: var(--text);
        padding: 10px;
        border-radius: 4px;
        box-shadow: 0 8px 18px rgba(100 ,100 ,100 , .6);
        background-color: var(--white);
        opacity: 0.9;
    }
    :global(.countdown:hover) .main,
    .main:hover{
        opacity: 1;
    }
    .content {
        user-select: none;
    }
    .timer {
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .timer-card {
        padding: 8px;
        border-radius: 4px;
        display: flex;
        align-items: center;
    }
    .timer-card.phase{
        background-color: var(--primary-light);
        color: var(--primary);
        justify-content: center;
        cursor: pointer;
    }
    .extend {
        padding-left: 10px;
        margin-left: auto;
    }
    .input-wrapper {
        margin: 0 8px;
        display: flex;
    }
    .input-wrapper :global(input) {
        width: 65px !important;
    }
    .controls {
        display: flex;
        margin-left: 10px;
    }
    .stopped-controls {
        display: flex;
        justify-content: center;
        margin-top: 10px;
    }
    .time  {
        font-weight: 600;
        border-radius: 4px;
        height: 35px;
        line-height: 35px;
        padding: 0 15px;
        font-size: 14px;
        text-align: center;
    }
    .time.stop {
        background-color: var(--red-light);
        color: var(--red);
    }
    .time.focus {
        background-color: var(--blue-light);
        color: var(--blue);
    }
    .time.break {
        background-color: var(--green-light);
        color: var(--green);
    }
    @keyframes blink  {
        0% {
            opacity: 1;
        }
        49% {
            opacity: 1;
        }
        50% {
            opacity: 0;
        }
        100% {
            opacity: 0;
        }
    }
    .paused {
        animation: blink 1s linear infinite;
    }
    .pomodoro-wrapper {
        margin: 10px 0;
        text-align: center;
    }
    .pomodoro-wrapper .emoji img {
        margin-top: 10px;
        font-size: 40px;
        filter: drop-shadow(0px 0px 3px rgb(0,0,0,0.3));
    }
    .pomodoros {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        margin-bottom: 5px;
        min-width: 300px;
    }
    .pomodoros span {
        flex: auto;
        max-width: 20px;
        margin: 5px;
        background-color:  #f33 !important;
        border-radius: 100%;
    }
    .pomodoros span:after {
        content: "";
        display: block;
        padding-bottom: 100%;
    }
    .separator {
        text-align: center;
        margin-bottom: 5px;
        font-weight: 500;
        font-size: 16px;
    }
</style>