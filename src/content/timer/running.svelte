<script context="module">
    export function preload(context) {
        const { phase, timer: { position, remaining, state }} = context;

        return { phase, position, remaining, state };
    }
</script>

<script>
    import { isIOS, isMacintosh } from "../../utils/platform";
    import Controls from "./components/controls.svelte";
    import { millisecondsToHumanReadableTime } from "../../utils/time";
    import Notification from "@kwangure/strawberry/components/Notification";
    import { timer } from "../../common/events";

    export let phase;
    export let state;
    export let remaining;
    export let position;

    let hidden = false;
    let time = "";

    $: time = hidden
        ? millisecondsToHumanReadableTime(
            remaining,
            (({ minutes }) => `${minutes}m`)
        )
        : millisecondsToHumanReadableTime(remaining);

    function handleKeyDown(event) {
        const isApple = isIOS || isMacintosh;
        if (isApple && !event.metaKey) return;
        if (!isApple && !event.ctrlKey) return;

        if (event.code === "Slash") {
            hidden = !hidden;
        }
    }

    function handleClick() {
        hidden = !hidden;
    }

    function handleDismiss() {
        timer.dismissRemainingWarning();
    }
</script>

<svelte:window on:keydown={handleKeyDown}/>
<svelte:head>
    {#if state.paused === "default"}
        <style>html { filter: grayscale(100%) }</style>
    {/if}
</svelte:head>

{#if state.running === "warnRemaining"}
    <Notification
        on:dismiss={handleDismiss}
        message={millisecondsToHumanReadableTime(
            remaining,
            (({ minutes, seconds }) => {
                if (minutes > 0) {
                    return `${minutes} minutes ${seconds} seconds remaining`;
                }

                return ` ${seconds} seconds remaining`;
            })
        )}/>
{/if}

<div class="countdown-wrapper {position}" class:hidden>
    <div class="countdown">
        <div class="timer {phase}" on:click={handleClick}>
            {time}
        </div>
        <Controls {hidden} {state} {position}/>
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