<script>
    import { TimerState, Phase } from '../../background/Timer'
    import { clamp, mmss } from '../../Filters'
    import { onDestroy, onMount } from 'svelte'
    import { PomodoroClient, SettingsClient } from '../../background/Services'
    import M from '../../Messages'
    import { Button}  from '@deimimi/strawberry'
    import { mdiPlayOutline, mdiRestart, mdiPause, mdiPictureInPictureBottomRightOutline } from '@mdi/js'

    let elapsed = null
    let state = null
    let phase = null
    let nextPhase = null
    let duration = null
    let checkpointElapsed = null
    let checkpointStartAt = null
    let timeInterval = null
    let pomodoroClient = new PomodoroClient()
    let settings = null
    let hasLongBreak = false
  
    const update = (data) => {
        if(!data) return
        state = data.state
        phase = data.phase
        nextPhase = data.nextPhase
        duration = data.duration
        checkpointElapsed = data.checkpointElapsed
        checkpointStartAt = data.checkpointStartAt
    }

    pomodoroClient.on('start', update)
    pomodoroClient.on('resume', update)
    pomodoroClient.on('stop', update)
    pomodoroClient.on('pause', update)
    pomodoroClient.on('expire', update)
    
    let status
    (async function resolve (){
        settings = await SettingsClient.once.getSettings()
        hasLongBreak = settings.longBreak.interval > 0
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
    
    $: timerClass = {
            null: '',
            [Phase.Focus]: 'focus',
            [Phase.ShortBreak]: 'break',
            [Phase.LongBreak]: 'break'
        }[phase]
    
    $: nextPhaseText = ((nextPhase, Phase, M, hasLongBreak)=> {
        if(elapsed == 0 && checkpointStartAt == null) {
            return M.start_focusing
        }
        return {
            null: '',
            [Phase.Focus]: M.start_focusing,
            [Phase.ShortBreak]: hasLongBreak ? M.take_a_short_break : M.take_a_break,
            [Phase.LongBreak]: M.take_a_long_break
        }[nextPhase];
    })(nextPhase, Phase, M, hasLongBreak)
    
    $: (function(to) {
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

    function onKeyDown(e) {
        if (e.key != " ") {
            return
        }

        if (state == TimerState.Running) {
            PomodoroClient.once.pause()
        } else if (state == TimerState.Paused) {
            PomodoroClient.once.resume()
        }
    }

    function onPause() {
        PomodoroClient.once.pause()
    }
    function onResume() {
        PomodoroClient.once.resume()
    }
    function onRestartTimer() {
        PomodoroClient.once.restart()
    }
    function onRestartCycle() {
        PomodoroClient.once.restartCycle()
    }
    function startTimer(){
        PomodoroClient.once.start()
    }
</script>

<div class="timer {timerClass}">
    <div class="time" class:paused={isPaused}>
        { time }
    </div>
    <div class="controls-wrapper">
        <div class="controls">
            {#if isPaused}
                <Button class="action" icon={mdiRestart} on:click={onRestartTimer}/>
                <Button class="action" icon={mdiPlayOutline}
                    on:click={onResume}/>
            {:else if isRunning}
                <Button class="action" icon={mdiPause} on:click={onPause}/>
            {:else if isStopped}
                <Button class="action text" icon={mdiPlayOutline}
                    on:click={startTimer}>
                    {nextPhaseText}
                </Button>
                <Button class="action text" icon={mdiRestart} on:click={onRestartCycle}>
                    {M.restart_pomodoro_cycle}
                </Button>
            {/if}
        </div>
    </div>
</div>

<style>
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