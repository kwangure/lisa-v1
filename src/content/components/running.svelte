<script>
    import Controls from "./controls.svelte";
    import { getContext } from "svelte";
    import { millisecondsToHumanReadableTime } from "~@utils/time";
    import Notification from "@kwangure/strawberry/components/Notification";
    import { timer } from "~@common/events";
    import Timer from "~@phase_ui/components/timer.svelte";

    const state = getContext("timer-state");

    $: ({ timerMachine } = $state);
    $: ({ position, remaining, state: timerState } = timerMachine);

    let hidden = false;

    $: time = hidden
        ? millisecondsToHumanReadableTime(
            remaining,
            (({ minutes }) => `${minutes}m`)
        )
        : millisecondsToHumanReadableTime(remaining);

    function handleDismiss() {
        timer.dismissRemainingWarning();
    }
</script>

<svelte:head>
    {#if timerState.paused === "default"}
        <style>html { filter: grayscale(100%) }</style>
    {/if}
</svelte:head>

{#if timerState.running === "warnRemaining"}
    <Notification
        on:dismiss={handleDismiss}
        message={millisecondsToHumanReadableTime(
            remaining,
            (({ minutes, seconds }) => {
                if (minutes > 0) {
                    return `${minutes} minutes ${seconds} seconds remaining`;
                }

                return `${seconds} seconds remaining`;
            })
        )}/>
{/if}

<div class="countdown-wrapper {position}" class:hidden>
    <div class="countdown">
        <Timer bind:hidden {time}/>
        <Controls {hidden}/>
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
</style>