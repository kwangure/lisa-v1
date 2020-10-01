<script context="module">
    import createTimerStore from "./timer.js";
    import { createSettingsWritable } from "../common/store/settings";
    
    export async function preload() {
        const timerStore  = await createTimerStore();
        const settingStore = await createSettingsWritable();

        return { timerStore, settingStore };
    }
</script>

<script>
    import { millisecondsToHumanReadableTime } from "../utils/time.js";
    import { timer } from "../common/events";
    import Button from "@deimimi/strawberry/components/Button";
    import Controls from "./controls.svelte";
    import Modal from "@deimimi/strawberry/components/Modal";
    
    const chrome = window.chrome;
    export let timerStore;
    export let settingStore;

    let timerPosition;

    $: ({ initialized, phase, remaining, state } = $timerStore || {});
    $: time = millisecondsToHumanReadableTime(remaining ?? 0);
    $: setTimerPosition($settingStore?.appearanceSettings?.timerPosition);

    function setTimerPosition(position){
        timerPosition = position;
    }
</script>

<svelte:options tag="lisa-timer"/>

<link rel="stylesheet" href={chrome.extension.getURL("__CONTENT_CSS__")}/>

{#if initialized}
    <div class="countdown-wrapper {timerPosition}">
        <div class="countdown">
            <div class="timer {phase}">
                {time}
            </div>
            <Controls paused={state==="paused" || state === "completed"}
                bind:position={timerPosition}/>
        </div>
    </div>
{:else if initialized === false}
    <Modal visible>
        <div slot="content">
            <Button on:click={() => timer.start()}>Start timer</Button>
        </div>
    </Modal>
{/if}

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