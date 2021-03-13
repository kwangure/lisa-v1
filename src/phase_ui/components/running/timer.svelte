<script>
    export let script;
    export let phase;
    export let time;
    export let hidden;

    function handleClick() {
        if (script !== "content") return;
        hidden = !hidden;
    }
</script>

<div class="timer {phase}" on:click={handleClick}>
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
</style>