<script>
    import { TimerState, Phase } from '../../background/Timer'
    import { OptionsClient, SettingsClient, HistoryClient, PomodoroClient } from '../../background/Services'
    import { clamp, mmss, pomodoroCount } from '../../Filters'
    import M from '../../Messages'
    import { Button, Dropdown, Modal, Tooltip, Input } from '@deimimi/strawberry'
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
    let settings = null
    let hasLongBreak = false
    let pomodoros = []
    let pomodorosUntilLongBreak = 0
    let extendValue = 5
    let timerStoppedModal = null
  
    const update = async (data) => {
        if(!data) return
        state = data.state
        phase = data.phase
        nextPhase = data.nextPhase
        duration = data.duration
        checkpointElapsed = data.checkpointElapsed
        checkpointStartAt = data.checkpointStartAt
        pomodoros.length = await HistoryClient.once.countToday()
        pomodoros = pomodoros
        pomodorosUntilLongBreak = await PomodoroClient.once.getPomodorosUntilLongBreak()
    }

    chrome.runtime.onMessage.addListener((message, sender, responnd)=>{
        const events = ['start', 'resume', 'stop', 'pause', 'extend', 'expire']
        if(events.includes(message.eventName)){
            update(message.args[0])
        }
    })
    
    let status;
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

    $: timerClass = isStopped? 'ls-stop' : {
            null: '',
            [Phase.Focus]: 'ls-focus',
            [Phase.ShortBreak]: 'ls-break',
            [Phase.LongBreak]: 'ls-break'
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
    function onRestartTimer() {
        PomodoroClient.once.restart()
    }
    function onRestartCycle() {
        PomodoroClient.once.restartCycle()
    }
    function startTimer(){
        PomodoroClient.once.start()
    }
    function extendTimer(durationInMins){
        let durationInSecs = durationInMins * 60
        PomodoroClient.once.extendBy(durationInSecs)
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

    let dropdownItems = [ 
        { 
            value: "Restart pomodoro cycle",
            clickFn: onRestartCycle,
        }, 
        { 
            value: "Restart current timer",
            clickFn: onRestartTimer,
        },
        { 
            value: "Open settings page",
            clickFn: showSettings,
        } 
    ]

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
    
    $: extendPhaseText = ((phase, Phase)=> {
        return {
            null: '',
            [Phase.Focus]: "Extend focus by",
            [Phase.ShortBreak]: "Extend short break by",
            [Phase.LongBreak]: "Extend long break by",
        }[phase];
    })(phase, Phase)
</script>

<svelte:options tag="lisa-countdown"/>

{#if isStopped}
    <Modal bind:this={timerStoppedModal} visible closable={false}>
        <div slot="content">
            {#if pomodoros.length > 0}
                <div class="ls-pomodoro-wrapper">
                    <div>Pomodoros Today</div>
                    <div class="ls-pomodoros">
                        {#each pomodoros as pomodoro}
                            <span></span>
                        {/each}
                    </div>
                    <div>
                        {M.pomodoros_until_long_break(pomodoroCount(pomodorosUntilLongBreak))}
                    </div>
                </div>
            {/if}
            <div class="ls-stopped-controls">
                <Tooltip label="Restart pomodoro cycle">
                    <Button 
                        on:click={ onRestartCycle } 
                        icon={ mdiRestart }
                        color="none" 
                        class="action"/>
                </Tooltip>
                <Tooltip label="Open history page">
                    <Button 
                        on:click={showHistory} 
                        icon={mdiHistory}
                        color="none" 
                        class="action"/>
                </Tooltip>
                <Tooltip label="Open settings page">
                    <Button 
                        on:click={showHistory} 
                        icon={mdiSettingsOutline}
                        color="none" 
                        class="action"/>
                </Tooltip>
            </div>
            {#if checkpointStartAt != null}
                <div class="ls-timer-card">
                    { extendPhaseText }
                    <div class="ls-input-wrapper">
                        <Input.Number bind:value={extendValue} min={1}/>
                    </div>
                    { extendValue == 1 ? M.minute: M.minutes }
                    <div class="ls-extend">
                        <Button color="primary"
                            on:click={() => extendTimer(extendValue) }>
                            Extend
                        </Button>
                    </div>
                </div>
                <div>or</div>
            {/if}
            <div on:click={startTimer} class="ls-timer-card phase">
                { nextPhaseText }
            </div>
        </div>
    </Modal>
{:else if visible }
    <div class="ls-countdown {right? 'ls-bottom-right':''} " transition:fly="{{ y: 200, duration: 1000 }}">
        <div class="ls-main">
            <div class="ls-timer">
                <div class="ls-time {timerClass} {isPaused? 'ls-paused':''}">
                    { time }
                </div>
                <div class="ls-controls">
                    {#if isPaused}
                        <Tooltip label="Resume timer">
                            <Button on:click={onResume} icon={mdiPlayOutline} color="none"/>
                        </Tooltip>
                    {:else if isRunning}
                        <Tooltip label="Pause timer">
                            <Button on:click={onPause} icon={mdiPause} color="none"/>
                        </Tooltip>
                    {:else if isStopped}
                        <Tooltip label="Start timer">
                            <Button on:click={startTimer} icon={mdiPlayOutline} color="none"/>
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