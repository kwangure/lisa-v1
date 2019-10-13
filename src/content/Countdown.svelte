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
    const { start, stop, pause, resume } = timer;

    let timer_stopped_modal = null;
    let visible = true;
    let right = true;
    let extend_timer_by = 5

    function toggleRight(){
        right = !right
    }

    function extendTimer(durationInMins){
        let durationInSecs = durationInMins * 60
    }

    let dropdownItems = [ 
        { 
            value: "Restart pomodoro cycle",
            clickFn: ()=>{},
        }, 
        { 
            value: "Restart current timer",
            clickFn: ()=>{},
        },
        { 
            value: "Open settings page",
            clickFn: ()=>{},
        } 
    ]

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

    $: time = mmss($timer.remaining|| 0);

    $: timer_class = $timer.is_stopped? 'ls-stop' : {
            null: '',
            [phases.FOCUS]: 'ls-focus',
            [phases.SHORT_BREAK]: 'ls-break',
            [phases.LONG_BREAK]: 'ls-break'
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
</script>

{#if $timer.is_stopped}
    <Modal bind:this={timer_stopped_modal} visible closable={false}>
        <div slot="content">
            {#if $timer.pomodoros_since_start.length > 0}
                <div class="ls-pomodoro-wrapper">
                    <div>Pomodoros Today</div>
                    <div class="ls-pomodoros">
                        {#each $timer.pomodoros_since_start as pomodoro}
                            <span></span>
                        {/each}
                    </div>
                    <div>
                        {$timer.pomodoros_since_start} Pomodoros Until Long Break
                    </div>
                </div>
            {/if}
            <div class="ls-stopped-controls">
                <Tooltip label="Restart pomodoro cycle">
                    <Button 
                        on:click={ ()=>{} } 
                        icon={ mdiRestart }
                        color="none" 
                        class="action"/>
                </Tooltip>
                <Tooltip label="Open history page">
                    <Button 
                        on:click={()=>{} } 
                        icon={mdiHistory}
                        color="none" 
                        class="action"/>
                </Tooltip>
                <Tooltip label="Open settings page">
                    <Button 
                        on:click={()=>{} } 
                        icon={mdiSettingsOutline}
                        color="none" 
                        class="action"/>
                </Tooltip>
            </div>
            {#if $timer.previous_phase}
                <div class="ls-timer-card">
                    {extend_phase_text}
                    <div class="ls-input-wrapper">
                        <Input.Number bind:value={extend_timer_by} min={1}/>
                    </div>
                    { extend_timer_by == 1 ? "minute" : "minutes" }
                    <div class="ls-extend">
                        <Button color="primary"
                            on:click={() => extendTimer(extend_timer_by) }>
                            Extend
                        </Button>
                    </div>
                </div>
                <div>or</div>
            {/if}
            <div on:click={ start } class="ls-timer-card phase">
                {next_phase_text}
            </div>
        </div>
    </Modal>
{:else if visible }
    <div class="ls-countdown">
        <div class="ls-main">
            <div class="ls-timer">
                <div class="ls-time {timer_class} {$timer.is_paused? 'ls-paused':''}">
                    { time }
                </div>
                <div class="ls-controls">
                    {#if $timer.is_paused}
                        <Tooltip label="Resume timer">
                            <Button on:click={resume} icon={mdiPlayOutline} color="none"/>
                        </Tooltip>
                    {:else if $timer.is_running}
                        <Tooltip label="Pause timer">
                            <Button on:click={pause} icon={mdiPause} color="none"/>
                        </Tooltip>
                    {:else if $timer.is_stopped}
                        <Tooltip label="Start timer">
                            <Button on:click={start} icon={mdiPlayOutline} color="none"/>
                        </Tooltip>
                    {/if}
                    {#if right}
                        <Tooltip label="Move timer left">
                            <Button 
                                on:click={toggleRight} 
                                icon={mdiPictureInPictureBottomRightOutline}
                                iconProps={{flip: 'h'}}
                                color="none" 
                                class="action"/>
                        </Tooltip>
                    {:else}
                        <Tooltip label="Move timer right">
                            <Button 
                                on:click={toggleRight} 
                                icon={mdiPictureInPictureBottomRightOutline}
                                color="none" 
                                class="action"/>
                        </Tooltip>
                    {/if}
                    <Dropdown items={dropdownItems} placement="topRight">
                        <div slot="button">
                            <Button color="none" icon={mdiDotsHorizontal}/>
                        </div>
                        <div slot="menu" let:item>
                            <div on:click={item.clickFn}>{item.value}</div>
                        </div>
                    </Dropdown>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    .ls-countdown {
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
    .ls-countdown.ls-bottom-right {
        bottom: 0px;
        right: 0px;
        left: auto;
    }
    .ls-main {
        display: flex;
        flex-direction: column;
        background-color: #fff;
        opacity: 0.9;
        color: #333;
        padding: 10px;
        border-radius: 4px;
        box-shadow: 0 8px 18px rgba(100 ,100 ,100 , .6);
    }
    :global(.ls-countdown:hover) .ls-main,
    .ls-main:hover{
        opacity: 1;
    }
    .ls-timer {
        display: flex;
        justify-content: center;
        align-items: center;
        opacity: 0.9;
    }
    .ls-timer-card {
        padding: 8px;
        border-radius: 4px;
        display: flex;
        align-items: center;
    }
    .ls-timer-card.phase{
        background-color: #deeaff;
        color: #1870ff;
        justify-content: center;
        cursor: pointer;
    }
    .ls-extend {
        padding-left: 10px;
        margin-left: auto;
    }
    .ls-input-wrapper {
        margin: 0 8px;
        display: flex;
    }
    .ls-input-wrapper :global(input) {
        width: 65px !important;
    }
    .ls-controls {
        display: flex;
        margin-left: 10px;
    }
    .ls-stopped-controls {
        display: flex;
        justify-content: center;
        margin-top: 10px;
    }
    .ls-time  {
        font-weight: 600;
        border-radius: 4px;
        height: 35px;
        line-height: 35px;
        padding: 0 15px;
        font-size: 14px;
        text-align: center;
    }
    .ls-time.ls-stop {
        background-color: #ffe8e8;
        color: #f33;
    }
    .ls-time.ls-focus {
        background-color: #deefff;
        color: #1870ff;
    }
    .ls-time.ls-break {
        background-color: #d3f8e1;
        color: #18d270;
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
    .ls-paused {
        animation: blink 1s linear infinite;
    }
    .ls-pomodoro-wrapper {
        margin-top: 10px;
        text-align: center;
    }
    .ls-pomodoros {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        margin-bottom: 5px;
        min-width: 300px;
    }
    .ls-pomodoros span {
        flex: auto;
        max-width: 20px;
        margin: 5px;
        background-color:  #f33 !important;
        border-radius: 100%;
    }
    .ls-pomodoros span:after {
        content: "";
        display: block;
        padding-bottom: 100%;
    }
</style>