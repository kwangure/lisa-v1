<script>
    import Controls from "./controls.svelte";
    import { isIOS, isMacintosh } from "../../utils/platform";
    import { onDestroy, onMount } from "svelte";
    import { millisecondsToHumanReadableTime } from "../../utils/time";
    
    export let phase;
    export let state;
    export let remaining;
    export let position;

    let hidden = false;
    let time = "";

    $: {
        if (hidden) {
            time = millisecondsToHumanReadableTime(remaining, (({ minutes }) => {
                return `${minutes}m`;
            }));
        } else {
            time = millisecondsToHumanReadableTime(remaining);
        }
    }

    function handleKeyDown(e) {
        const isApple = isIOS || isMacintosh;
        if (isApple && !e.metaKey) return;
        if (!isApple && !e.ctrlKey) return;
    
        if (e.code === "Slash") {
            hidden = !hidden;
        }
    }

    function handleClick() {
        hidden = !hidden;
    }

    onMount(() => {
        addEventListener("keydown", handleKeyDown);
    });
    onDestroy(() => {
        removeEventListener("keydown", handleKeyDown);
    });
</script>

<div class="countdown-wrapper {position}" class:hidden>
    <div class="countdown">
        <div class="timer {phase}" on:click={handleClick}>
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
    }
    .countdown:hover {
        opacity: 1;
    }
    .hidden .countdown {
        border-radius: 50%;
        overflow: hidden;
    }
    .hidden :global(.controls) {
        display: none;
    }
    .timer {
        font-weight: 600;
        line-height: 50px;
        padding: 0 20px;
        border-radius: var(--br-border-radius);
        cursor: pointer;
    }
    .hidden .timer {
        padding: 0 12px;
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