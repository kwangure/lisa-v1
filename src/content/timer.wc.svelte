<script>
    import { millisecondsToHumanReadableTime } from "../utils/time.js";
    import Controls from "./controls.svelte";
    import createTickListener from "./tickListener.js";
    
    const chrome = window.chrome;
    let phase = "";
    let time = "";
    let remaining = 0;
    let tickListener = null;
    (async () => {
        tickListener = await createTickListener();
    })();

    $: {
        if (tickListener) {
            ({ phase, remaining } = $tickListener);
            time = millisecondsToHumanReadableTime(remaining);
        }
    }
</script>

<svelte:options tag="lisa-timer"/>

<link rel="stylesheet" href={chrome.extension.getURL("__CONTENT_CSS__")}/>

<div class="countdown-wrapper bottom-right">
    <div class="countdown">
        <div class="timer {phase}">
            {time}
        </div>
        <Controls/>
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
    .timer.break {
        background-color: var(--br-green-light);
        color: var(--br-green);
    }
</style>