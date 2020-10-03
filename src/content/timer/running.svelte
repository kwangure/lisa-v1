<script>
    import Controls from "./controls.svelte";
    
    export let phase;
    export let state;
    export let time;
    export let position;
</script>

<div class="countdown-wrapper {position}">
    <div class="countdown">
        <div class="timer {phase}">
            {time}
        </div>
        <Controls paused={state==="paused" || state === "completed"}
            {position}/>
    </div>
</div>

<style>
    .countdown-wrapper {
        position: fixed;
        bottom: 0px;
        left: 0px;
        padding: 20px 28px;
        background-color: transparent;
        font-size: 14px;
        font-family: --apple-system, Arial, Helvetica, sans-serif;
        z-index: 50001 !important;
        user-select: none;
    }
    .bottom-right {
        bottom: 0px;
        right: 0px;
        left: auto;
        padding-top: 0px;
        padding-left: 0px;
    }
    .countdown {
        align-items: center;
        background-color: var(--br-white);
        border-radius: var(--br-border-radius);
        box-shadow: 0 8px 18px rgba(100 ,100 ,100 , .6);
        color: var(--br-text);
        display: flex;
        justify-self: start;
        opacity: 0.9;
        overflow: hidden;
    }
    .countdown:hover {
        opacity: 1;
    }
    .timer {
        font-weight: 600;
        line-height: 50px;
        padding: 0 20px;
    }
    .timer.stop {
        background-color: var(--br-red-light);
        color: var(--br-red);
    }
    .timer.focus {
        background-color: var(--br-blue-light);
        color: var(--br-blue);
    }
    .timer.shortBreak,
    .timer.longBreak {
        background-color: var(--br-green-light);
        color: var(--br-green);
    }
</style>