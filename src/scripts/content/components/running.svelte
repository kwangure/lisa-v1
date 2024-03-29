<script>
    import Controls from "./controls.svelte";
    import { createSettingStore } from "~@common/settings";
    import { formatMilliseconds } from "~@utils/time";
    import { getContext } from "svelte";
    import Notification from "@kwangure/strawberry/components/Notification";
    import { timer } from "~@common/events";
    import Timer from "./timer.svelte";

    const state = getContext("timer-state");
    const settings = createSettingStore();

    const SECOND = 1000;
    const MINUTE = 60 * SECOND;

    $: ({ timerMachine } = $state);
    $: ({ remaining, state: timerState } = timerMachine);
    $: ({ timerPosition } = $settings.appearanceSettings);
    $: shortTime = formatMilliseconds(remaining, {
        format: remaining < (60 * SECOND)
            ? ["hours", "minutes", "seconds"]
            : ["hours", "minutes"],
        formatter: { xHours: "h", xMinutes: "m", xSeconds: "s" },
    });
    $: clockTime = formatMilliseconds(remaining, {
        format: remaining < (60 * MINUTE)
            ? ["minutes", "seconds"]
            : ["hours", "minutes", "seconds"],
        delimiter: ":",
        formatter: { xHours: "", xMinutes: "", xSeconds: "" },
        zero: true,
        pad: true,
    });

    function handleDismiss() {
        timer.dismissRemainingWarning();
    }
</script>

<svelte:head>
    {#if timerState.paused === "default"}
        <style>html { filter: grayscale(100%) }</style>
    {/if}
</svelte:head>

<Notification on:dismiss={handleDismiss}
    visible={timerState.running === "warnRemaining"} removeAfter={0}
    message="{formatMilliseconds(remaining)} remaining"/>

<div class="countdown-wrapper {timerPosition}">
    <div class="countdown">
        <Timer time={clockTime}/>
        <Timer time={shortTime}/>
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
    }
    .countdown:hover {
        opacity: 1;
    }
    .countdown :global(.controls) {
        width: 0px;
        margin: 0px;
        transition: all 0.35s ease-out;
        /* Override all transition */
        transition-property: width, margin, padding;
        overflow: hidden;
    }
    .countdown:hover :global(.controls) {
        /*
            Hard code width to workaround Custom Elemnt transition issue.
            See https://github.com/sveltejs/svelte/issues/4735 for more.
        */
        width: 132px;
        margin: 0px 10px;
    }
    .countdown :global(.berry-dropdown-menu.visible) {
        display: none;
    }
    .countdown:hover :global(.berry-dropdown-menu.visible) {
        display: block;
    }
    .countdown:not(:hover) :global(.timer:nth-child(1)),
    .countdown:hover :global(.timer:nth-child(2)) {
        display: none;
    }
</style>