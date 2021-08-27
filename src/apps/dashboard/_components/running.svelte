<script>
    import {
        mdiAlarmOff,
        mdiAutorenew,
        mdiPause,
        mdiPlayOutline,
        mdiRestart,
    } from "@mdi/js";
    import Button from "@kwangure/strawberry/components/Button";
    import { formatMilliseconds } from "~@utils/time";
    import { minutesToMilliseconds } from "date-fns";
    import Notification from "@kwangure/strawberry/components/Notification";
    import Tooltip from "@kwangure/strawberry/components/Tooltip";

    export let timer;

    const { state } = timer;

    $: ({ timerMachine, phase } = $state);
    $: ({ remaining, state: timerState } = timerMachine);
    $: clockTime = formatMilliseconds(remaining, {
        format: remaining < minutesToMilliseconds(60)
            ? ["minutes", "seconds"]
            : ["hours", "minutes", "seconds"],
        delimiter: ":",
        formatter: { xHours: "", xMinutes: "", xSeconds: "" },
        zero: true,
        pad: true,
    });
    $: showPlay = timerState.paused === "default" || timerState === "completed";

    function handleDismiss() {
        timer.dismissRemainingWarning();
    }
</script>

<Notification on:dismiss={handleDismiss}
    visible={timerState.running === "warnRemaining"} removeAfter={0}
    message="{formatMilliseconds(remaining)} remaining"/>

<div class="countdown">
    <div class="timer {phase}">
        {clockTime}
    </div>
    <div class="controls">
        <Tooltip>
            <svelte:fragment slot="popup">
                {showPlay ? "Resume" : "Pause"}
            </svelte:fragment>
            <Button icon={showPlay ? mdiPlayOutline : mdiPause}
                on:click={showPlay ? timer.play : timer.pause}/>
        </Tooltip>
        <Tooltip>
            <svelte:fragment slot="popup">Disable</svelte:fragment>
            <Button icon={mdiAlarmOff} on:click={timer.disable}/>
        </Tooltip>
        <Tooltip>
            <svelte:fragment slot="popup">Restart running timer</svelte:fragment>
            <Button icon={mdiRestart} on:click={timer.reset}/>
        </Tooltip>
        <Tooltip>
            <svelte:fragment slot="popup">Reset focus cycle</svelte:fragment>
            <Button icon={mdiAutorenew} on:click={timer.restart}/>
        </Tooltip>
    </div>
</div>

<style>
    .countdown {
        display: grid;
        gap: 10px;
    }
    .timer {
        font-weight: 600;
        line-height: 50px;
        padding: 0 20px;
        border-radius: var(--br-border-radius);
        cursor: pointer;
        text-align: center;
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
    .controls {
        display: flex;
        margin: 0 10px;
        justify-content: center;
    }
    .controls :global(.berry-button) {
        --br-border: none;
    }
</style>