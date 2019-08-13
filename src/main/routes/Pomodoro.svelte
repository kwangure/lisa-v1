<script>
    import { TimerState, Phase } from '../../background/Timer';
    import { OptionsClient, SettingsClient, PomodoroClient } from '../../background/Services';
    import { clamp, mmss } from '../../Filters';
    import M from '../../Messages';
    import Button from '../components/Button.svelte'
    import Timer from '../components/Timer.svelte'
    import { onDestroy, onMount } from 'svelte'

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

    onDestroy(() => {
        clearInterval(timeInterval)
        pomodoroClient.dispose()
    })

    $: remaining = duration - elapsed

    $:  remainingSeconds = Math.ceil(remaining)

    $: elapsedSeconds = Math.ceil(elapsed)
    
    $: hasTime = duration != null &&
            checkpointStartAt != null &&
            checkpointElapsed != null;

    $: checkpointStartAt && updateElapsed()

    $: checkpointElapsed && updateElapsed()
    
    $: duration && updateElapsed()
    
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

    onMount(()=>{
        document.addEventListener('keydown', onKeyDown);
    })

    onDestroy(()=>{
        document.removeEventListener('keydown', onKeyDown);
    })
    
    function showSettings() {
        OptionsClient.once.showPage('settings');
    }

    function showHistory() {
        OptionsClient.once.showPage('history');
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
  
    $: timerClass = {
            null: '',
            [Phase.Focus]: 'focus',
            [Phase.ShortBreak]: 'break',
            [Phase.LongBreak]: 'break'
        }[phase];

    async function saveState(to) {
        if (to != TimerState.Stopped) {
            return;
        }
        
        let settings = await SettingsClient.once.getSettings();
        let { countdown } = settings[{
            [Phase.Focus]: 'focus',
            [Phase.ShortBreak]: 'shortBreak',
            [Phase.LongBreak]: 'longBreak'
        }[phase]];
        if (countdown.autoclose) {
            //window.close();
        }
    }
    
    $: saveState(state)
    $: updateTitle(title)
</script>

<div>
    <div class="countdown">
        <Timer
            class={timerClass}
            state={state}
            duration={duration}
            elapsed={elapsed}
            enabled={hasTime}
            pause={onPause}
            resume={onResume}
            restart={onRestart}/>
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
</style>