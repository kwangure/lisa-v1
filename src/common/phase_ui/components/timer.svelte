<script>
    import { getContext } from "svelte";

    export let hidden;
    export let time;

    const state = getContext("timer-state");
    const script = getContext("script");

    $: ({ phase, status } = $state);

    function handleClick() {
        if (script !== "content") return;
        hidden = !hidden;
    }
</script>

<div class="timer {phase}" class:disabled={status === "disabled"}
    on:click={handleClick}>
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
    :global(.hidden) .timer {
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
    .timer.disabled {
        background-color: var(--br-red-light);
        color: var(--br-red);
    }
</style>