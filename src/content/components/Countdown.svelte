<script>
    import { TimerState, Phase } from '../../background/Timer'
    import { OptionsClient, SettingsClient, PomodoroClient } from '../../background/Services'
    import { clamp, mmss } from '../../Filters'
    import M from '../../Messages'
    import Button from '../../main/components/Button.svelte'
    import Tooltip from '../../main/components/Tooltip.svelte'
    import { onDestroy, onMount } from 'svelte'
    import { fly } from 'svelte/transition'
    
    let visible = true
    let right = true
    let elapsed = null
    let state = null
    let phase = null
    let nextPhase = null
    let duration = null
    let checkpointElapsed = null
    let checkpointStartAt = null
    let timeInterval = null
    let pomodoroClient = new PomodoroClient()
  
    const update = (data) => {
        if(!data) return
        state = data.state
        phase = data.phase
        nextPhase = data.nextPhase
        duration = data.duration
        checkpointElapsed = data.checkpointElapsed
        checkpointStartAt = data.checkpointStartAt
    }

    chrome.runtime.onMessage.addListener((message, sender, responnd)=>{
        const events = ['start', 'resume', 'stop', 'pause', 'expire']
        if(events.includes(message.eventName)){
            update(message.args[0])
        }
    })
    
    let status
    (async function resolve (){
        status = await pomodoroClient.getStatus()
        update(status)
        updateElapsed()
        
    })()

    onMount(()=>{
        document.addEventListener('keydown', onKeyDown)
    })

    onDestroy(() => {
        clearInterval(timeInterval)
        pomodoroClient.dispose()
        document.removeEventListener('keydown', onKeyDown)
    })

    $: isRunning = state == TimerState.Running
    $: isPaused = state == TimerState.Paused
    $: isStopped = state == TimerState.Stopped

    //Update hasTime first as it's used by updateElapsed
    $: hasTime = duration != null &&
            checkpointStartAt != null &&
            checkpointElapsed != null
    $: checkpointStartAt && updateElapsed()
    $: checkpointElapsed && updateElapsed()
    $: duration && updateElapsed()

    $: remaining = duration - elapsed
    $: remainingSeconds = Math.ceil(remaining)
    $: elapsedSeconds = Math.ceil(elapsed)
    $: time = (()=> {
        if (!hasTime) {
            return '––:––'
        }
        let remaining = Math.max(0, Math.ceil(duration - elapsed))
        return mmss(remaining)
    })()

    $: timerClass = isStopped? 'stopped' : {
            null: '',
            [Phase.Focus]: 'focus',
            [Phase.ShortBreak]: 'break',
            [Phase.LongBreak]: 'break'
        }[phase]
    
    $: (function updateTime(to) {
        clearInterval(timeInterval)
        // Set time update interval based on angular velocity (500px radius circle)
        // to ensure smooth animation. Clamp interval between 20-1000ms.
        let interval = clamp(1000 / (500 * (2 * Math.PI / duration)), 20, 1000)
        if (to == TimerState.Running) {
            timeInterval = setInterval(() => updateElapsed(), interval)
        } else {
            updateElapsed()
        }
    })(state)

    function updateElapsed() {
        if (!hasTime) {
            elapsed = 0
            return
        }
        let totalElapsed = checkpointElapsed
        if (checkpointStartAt && state == TimerState.Running) {
            totalElapsed += (Date.now() - checkpointStartAt) / 1000
        }
        elapsed = Math.min(duration, totalElapsed)
        let remaining = Math.ceil(duration - elapsed)
        if (remaining == 0) {
            clearInterval(timeInterval)
        }
    }
    
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

    function onPause() {
        PomodoroClient.once.pause()
    }
    function onResume() {
        PomodoroClient.once.resume()
    }
    function onRestart() {
        PomodoroClient.once.restart()
    }
    function startTimer(){
        PomodoroClient.once.start()
    }

    function showSettings() {
        OptionsClient.once.showPage('settings')
    }

    function showHistory() {
        OptionsClient.once.showPage('history')
    }

    function toggleRight(){
        right = !right
    }
</script>

{#if visible}
    <div class="ls-countdown {right? 'ls-bottom-right':''} " transition:fly="{{ y: 200, duration: 1000 }}">
        <div class="ls-timer">
            <div class="ls-time {timerClass} {isPaused? 'ls-paused':''}">
                { time }
            </div>
            <div class="ls-controls">
                {#if isPaused}
                    <Tooltip label="Resume timer">
                        <Button on:click={onResume} icon="play-outline" color="none"/>
                    </Tooltip>
                    <Tooltip label="Restart timer">
                        <Button on:click={onRestart} icon="restart" color="none"/>
                    </Tooltip>
                {:else if isRunning}
                    <Tooltip label="Pause timer">
                        <Button on:click={onPause} icon="pause" color="none"/>
                    </Tooltip>
                {:else if isStopped}
                    <Tooltip label="Start timer">
                        <Button on:click={startTimer} icon="play-outline" color="none"/>
                    </Tooltip>
                {/if}
                {#if right}
                    <Tooltip label="Move timer left">
                        <Button 
                            on:click={toggleRight} 
                            icon="picture-in-picture-bottom-right-outline"
                            iconProps={{flip: 'h'}}
                            color="none" 
                            class="action"/>
                    </Tooltip>
                {:else}
                    <Tooltip label="Move timer right">
                        <Button 
                            on:click={toggleRight} 
                            icon="picture-in-picture-bottom-right-outline" 
                            color="none" 
                            class="action"/>
                    </Tooltip>
                {/if}
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
    }
    .ls-countdown.ls-bottom-right {
        bottom: 0px;
        right: 0px;
        left: auto;
    }
    .ls-timer {
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: #fff;
        opacity: 0.9;
        color: #333;
        padding: 10px;
        border-radius: 4px;
        box-shadow: 0 8px 18px rgba(100 ,100 ,100 , .6);
    }
    :global(.ls-countdown:hover) .ls-timer,
    .ls-timer:hover{
        opacity: 1;
    }
    .ls-controls {
        display: flex;
        margin-left: 10px;
    }
    .ls-time  {
        background-color: rgba(255, 0, 0, 0.2);
        color: rgba(255, 0, 0, 0.6);
        font-weight: 600;
        border-radius: 4px;
        height: 35px;
        line-height: 35px;
        padding: 0 15px;
        font-size: 14px;
        text-align: center
    }
    .ls-time.ls-stop {
        background-color: #fee8f0;
        color: #d21967;
    }
    .ls-time.ls-focus {
        background-color: #e8f0fe;
        color: #1967d2;
    }
    .ls-time.ls-break {
        background-color: #e8fef0;
        color: #19d267;
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
</style>