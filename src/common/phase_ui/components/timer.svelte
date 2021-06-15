<script>
    import { getContext } from "svelte";

    export let time;

    const state = getContext("timer-state");

    $: ({ phase, status } = $state);
</script>

<div class="timer {phase}" class:disabled={status === "disabled"}>
    {time}
</div>

<style>
    .timer {
        font-weight: 600;
        line-height: 50px;
        padding: 0 20px;
        border-radius: var(--br-border-radius);
        cursor: pointer;
        text-align: center;
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
    .timer.disabled {
        background-color: var(--br-red-light);
        color: var(--br-red);
    }
</style>