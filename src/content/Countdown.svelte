<script>
    import { timer_readable } from "./timer_store"
    import { Button, Dropdown, Input, Modal, Tooltip } from "@deimimi/strawberry"
    import { phases } from "../background/pomodoro_store"
    import { 
        mdiDotsHorizontal,
        mdiEyeOffOutline,
        mdiHistory,
        mdiPlayOutline, 
        mdiRestart, 
        mdiPause, 
        mdiPictureInPictureBottomRightOutline,
        mdiSettingsOutline,
        mdiVolumeOff
    } from '@mdi/js'
    import { onDestroy, onMount } from 'svelte'
    import { mmss } from "./utils"

    let timer = timer_readable();

    let timer_stopped_modal = null;
    let visible = true;
    let right = true;
    let pomodoros = [];
    let extend_timer_by = 5;

    function toggle_right(){
        right = !right
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
        { 
            value: "Open settings page",
            clickFn: ()=>{},
        } 
    ]

    const ARROW_LEFT = 37
    const ARROW_UP = 38
    const ARROW_RIGHT = 39
    const ARROW_DOWN = 40
    
    function onKeyDown(e) {
        if(!e.altKey || !e.shiftKey) return;
        
        if (e.keyCode == ARROW_LEFT) {
            right = false
        } else if (e.keyCode == ARROW_UP) {
            visible = true
        } else if (e.keyCode == ARROW_RIGHT) {
            right = true
        } else if (e.keyCode == ARROW_DOWN) {
            visible = false
        }
    }

    onMount(()=>{
        document.addEventListener('keydown', onKeyDown)
    })
    onDestroy(() => {
        document.removeEventListener('keydown', onKeyDown)
    })

    $: time = mmss(($timer && $timer.remaining)|| 0);

    $: timer_class = $timer.is_stopped? 'stop' : {
            null: '',
            [phases.FOCUS]: 'focus',
            [phases.SHORT_BREAK]: 'break',
            [phases.LONG_BREAK]: 'break'
        }[$timer.phase]
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
    
    $: extend_phase_text = {
        null: '',
        [phases.FOCUS]: "Extend focus by",
        [phases.SHORT_BREAK]: "Extend short break by",
        [phases.LONG_BREAK]: "Extend long break by",
    }[$timer.phase];

    $: pomodoros.length = $timer.pomodoros_since_start || 0
</script>

{#if $timer && $timer.is_stopped}
    <berry-modal bind:this={timer_stopped_modal} visible={true} closable={false}>
        <div slot="content">
            {#if pomodoros > 0}
                <div class="pomodoro-wrapper">
                    <div>Pomodoros Today</div>
                    <div class="pomodoros">
                        {#each pomodoros as pomodoro}
                            <span></span>
                        {/each}
                    </div>
                    <div>
                        {$timer.pomodoros_since_start} Pomodoros Until Long Break
                    </div>
                </div>
            {/if}
            <div class="stopped-controls">
                <berry-tooltip label="Restart pomodoro cycle">
                    <berry-button 
                        on:click={ timer.restart } 
                        icon={ mdiRestart }
                        color="none" 
                        class="action"/>
                </berry-tooltip>
                <berry-tooltip label="Open history page">
                    <berry-button 
                        on:click={()=>{} } 
                        icon={mdiHistory}
                        color="none" 
                        class="action"/>
                </berry-tooltip>
                <berry-tooltip label="Open settings page">
                    <berry-button 
                        on:click={()=>{} } 
                        icon={mdiSettingsOutline}
                        color="none" 
                        class="action"/>
                </berry-tooltip>
            </div>
            {#if $timer.previous_phase}
                <div class="timer-card">
                    {extend_phase_text}
                    <div class="input-wrapper">
                        <berry-input-number value={extend_timer_by} min={1}
                            on:input={(event) => extend_timer_by = event.target.value}/>
                    </div>
                    { extend_timer_by == 1 ? "minute" : "minutes" }
                    <div class="extend">
                        <berry-button color="primary"
                            on:click={() => timer.extend(extend_timer_by) }>
                            Extend
                        </berry-button>
                    </div>
                </div>
                <div class="separator">or</div>
            {/if}
            <div on:click={ timer.start } class="timer-card phase">
                {next_phase_text}
            </div>
        </div>
    </berry-modal>
{:else if visible }
    <div class="countdown {right? 'bottom-right':''}">
        <div class="main">
            <div class="timer">
                <div class="time {timer_class} {$timer.is_paused? 'paused':''}">
                    { time }
                </div>
                <div class="controls">
                    {#if $timer.is_paused}
                        <berry-tooltip label="Resume timer">
                            <berry-button on:click={timer.resume} icon={mdiPlayOutline} color="none"/>
                        </berry-tooltip>
                    {:else if $timer.is_running}
                        <berry-tooltip label="Pause timer">
                            <berry-button on:click={timer.pause} icon={mdiPause} color="none"/>
                        </berry-tooltip>
                    {:else if $timer.is_stopped}
                        <berry-tooltip label="Start timer">
                            <berry-button on:click={timer.start} icon={mdiPlayOutline} color="none"/>
                        </berry-tooltip>
                    {/if}
                    {#if right}
                        <berry-tooltip label="Move timer left">
                            <berry-button 
                                on:click={toggle_right} 
                                icon={mdiPictureInPictureBottomRightOutline}
                                iconProps={{flip: 'horizontal'}}
                                color="none" 
                                class="action"/>
                        </berry-tooltip>
                    {:else}
                        <berry-tooltip label="Move timer right">
                            <berry-button 
                                on:click={toggle_right} 
                                icon={mdiPictureInPictureBottomRightOutline}
                                color="none" 
                                class="action"/>
                        </berry-tooltip>
                    {/if}
                    <berry-dropdown placement="topRight">
                        <div slot="button">
                            <berry-button color="none" icon={mdiDotsHorizontal}/>
                        </div>
                        {#each dropdownItems as item}
                            <berry-dropdown-item on:click={item.clickFn}>
                                {item.value}
                            </berry-dropdown-item>
                        {/each}
                    </berry-dropdown>
                </div>
            </div>
        </div>
    </div>
{/if}

<svelte:options tag="lisa-timer"/>

<style>
    @import "@deimimi/strawberry/css/strawberry.css";
    :host {
        font-size: 14px;
        font-family: var(--font);
    }
    .countdown, 
    berry-modal {
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
        margin-top: 10px;
        text-align: center;
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