<script>
    import { TimerState, Phase } from '../../background/Timer'
    import { clamp, mmss } from '../../Filters'
    import { onDestroy, onMount } from 'svelte'
    import { PomodoroClient } from '../../background/Services'
    import M from '../../Messages'
    import Button from '../components/Button.svelte'

    let elapsed = null
    let state = null
    let phase = null
    let duration = null
    let checkpointElapsed = null
    let checkpointStartAt = null
    let timeInterval = null
    let pomodoroClient = new PomodoroClient()
  
    const update = (data) => {
        if(!data) return
        state = data.state
        phase = data.phase
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

    $: checkpointStartAt && updateElapsed()
    $: checkpointElapsed && updateElapsed()
    $: duration && updateElapsed()

    $: isRunning = state == TimerState.Running
    $: isPaused = state == TimerState.Paused
    $: isStopped = state == TimerState.Stopped
    $: hasTime = duration != null &&
            checkpointStartAt != null &&
            checkpointElapsed != null

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
    function onRestart() {
        PomodoroClient.once.restart()
    }
</script>

<div class="timer {timerClass}">
    <div class="time" class:paused={isPaused}>
        { time }
    </div>
    <div class="controls">
        {#if isPaused}
            <Button on:click={onResume} icon="play"/>
            <Button on:click={onRestart} icon="restart"/>
        {:else if isRunning}
            <Button on:click={onPause} icon="pause"/>
        {/if}
    </div>
</div>

<style>
    .timer {
        color:#fff;
    }
    .time {
      font-weight: 500;
      font-size: 30px;
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
</style>