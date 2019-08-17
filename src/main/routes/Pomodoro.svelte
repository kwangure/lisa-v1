<script>
    import { TimerState, Phase } from '../../background/Timer'
    import { clamp, mmss } from '../../Filters'
    import { onDestroy, onMount } from 'svelte'
    import { OptionsClient, SettingsClient, PomodoroClient } from '../../background/Services'
    import M from '../../Messages';
    import Button from '../components/Button.svelte'
    import Icon from '../components/Icon.svelte'

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
    
    let status;
    (async function resolve (){
        status = await pomodoroClient.getStatus()
        update(status)
        updateElapsed()
        
    })()

    onMount(()=>{
        document.addEventListener('keydown', onKeyDown);
    })

    onDestroy(() => {
        clearInterval(timeInterval)
        pomodoroClient.dispose()
        document.removeEventListener('keydown', onKeyDown);
    })

    $: checkpointStartAt && updateElapsed()
    $: checkpointElapsed && updateElapsed()
    $: duration && updateElapsed()

    $: isRunning = state == TimerState.Running;
    $: isPaused = state == TimerState.Paused;
    $: isStopped = state == TimerState.Stopped
    $: hasTime = duration != null &&
            checkpointStartAt != null &&
            checkpointElapsed != null;

    $: remaining = duration - elapsed
    $: remainingSeconds = Math.ceil(remaining)
    $: elapsedSeconds = Math.ceil(elapsed)
    $: time = (()=> {
        if (!hasTime) {
            return '––:––';
        }
        let remaining = Math.max(0, Math.ceil(duration - elapsed));
        return mmss(remaining);
    })()

    $: timerClass = {
            null: '',
            [Phase.Focus]: 'focus',
            [Phase.ShortBreak]: 'break',
            [Phase.LongBreak]: 'break'
        }[phase];
    
    $: (function(to) {
        clearInterval(timeInterval);
        // Set time update interval based on angular velocity (500px radius circle)
        // to ensure smooth animation. Clamp interval between 20-1000ms.
        let interval = clamp(1000 / (500 * (2 * Math.PI / duration)), 20, 1000);
        if (to == TimerState.Running) {
            timeInterval = setInterval(() => updateElapsed(), interval);
        } else {
            updateElapsed();
        }
    })(state)

    function updateElapsed() {
        if (!hasTime) {
            elapsed = 0;
            return;
        }
        let totalElapsed = checkpointElapsed;
        if (checkpointStartAt && state == TimerState.Running) {
            totalElapsed += (Date.now() - checkpointStartAt) / 1000;
        }
        elapsed = Math.min(duration, totalElapsed);
        let remaining = Math.ceil(duration - elapsed);
        if (remaining == 0) {
            clearInterval(timeInterval);
        }
    }

    function onKeyDown(e) {
        if (e.key != " ") {
            return;
        }

        if (state == TimerState.Running) {
            PomodoroClient.once.pause();
        } else if (state == TimerState.Paused) {
            PomodoroClient.once.resume();
        }
    }

    function onPause() {
        PomodoroClient.once.pause();
    }
    function onResume() {
        PomodoroClient.once.resume();
    }
    function onRestart() {
        PomodoroClient.once.restart();
    }

    function showSettings() {
        OptionsClient.once.showPage('settings');
    }

    function showHistory() {
        OptionsClient.once.showPage('history');
    }
</script>

<div>
    <div class="countdown">
        <div class="timer {timerClass}">
            <div class="overlay">
                <div class="controls">
                    {#if isPaused}
                        <Button on:click={onRestart} icon="restart">
                            {M.restart_timer}
                        </Button>
                    {:else}
                        <Button class="placeholder">Placeholder</Button>
                    {/if}  
                </div>
                <div class="time" class:enabled={hasTime} class:paused={isPaused}>
                    { time }
                </div>
                <div class="controls">
                    {#if isRunning}
                        <Button on:click={onPause} icon="pause">
                            {M.pause_timer}
                        </Button>
                    {:else if isPaused}
                        <Button on:click={onResume} icon="play">
                            {M.resume_timer}
                        </Button>
                    {:else}
                        <Button class="placeholder">Placeholder</Button>
                    {/if}
                </div>
            </div>
        </div>
    </div>
    <Button on:click={showSettings} icon="settings-outline" class="settings">
        <span>{ M.settings }</span>
    </Button>
    <Button on:click={showHistory}  icon="history" class="history placeholder">
        <span>{ M.view_history }</span>
    </Button>
</div>

<style>
    .countdown {
        display: flex;
        height: 100vh;
        max-width: 100vw;
        justify-content: center;
        align-items: center;
        background-color: black;
        color:#fff;
    }
    :global(.timer) {
        height: 90%;
        width: 90%;
    }
    :global(.timer svg path.elapsed) {
        stroke: #d42;
    }
    :global(.timer.focus svg path.elapsed) {
        stroke: #42d;
    }
    :global(.timer.break svg path.elapsed) {
        stroke: #5a4;
    }
    span {
        display: none;
    }
    @media (min-width: 600px) {
        span {
        display: inherit;
        }
    }
    :global(.settings) {
        left: 30px;
        bottom: 50px;
    }
    :global(.history) {
        display: none;
        left: 40px;
        bottom: 50px;
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
    .timer {
        height: 100%;
        width: 100%;
        position: relative;
    }
    .timer svg {
        width: 100%;
        height: 100%;
    }
    .timer svg path.duration {
        stroke: #aaa;
        stroke-width: 3px;
        fill: none;
    }
    .timer svg path.elapsed {
        stroke-width: 3px;
        stroke-linecap: round;
        fill: none;
    }
    .overlay {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        right: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }
    .overlay .time {
      font-weight: 500;
      color: rgba(255, 255, 255, 0.65);
      font-size: 30px;
    }
    .enabled {
        color: #333;
    }
    .paused {
        animation: blink 1s linear infinite;
    }
    .controls {
        z-index: 2;
        margin: 3vmin 0;
    }
    .controls svg {
        width: 7vmin;
        height: 7vmin;
    }
    :global(.placeholder){
        visibility: hidden;
    }
</style>