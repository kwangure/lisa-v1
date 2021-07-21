<script>
    import Disabled from "./_components/disabled.svelte";
    import { phaseNames } from "~@common/settings";
    import { readable } from "svelte/store";
    import Running from "./_components/running.svelte";
    import { setContext } from "svelte";
    import { timer } from "~@common/events";

    const state = readable({}, (set) => {
        timer.getState().then(set);
        timer.all((_, payload) => set(payload));
    });

    setContext("timer-state", state);

    $: ({ disabled, phase, status, nextPhase } = $state || {});
    $: nextPhaseName = phaseNames[nextPhase]?.toLowerCase();

</script>

<div class="popup" >
    <div class="timer">
        {#if status === "setup"}
            Time to start Lisa!
        {:else if  status === "active"}
            {#if phase === "disabling"}
                Disabling Lisa...
            {:else if phase === "transition"}
                Transitioning to {nextPhaseName}
            {:else}
                <Running/>
            {/if}
        {:else if status === "disabled"}
            {#if disabled == "default"}
                <Disabled/>
            {:else if disabled == "transition"}
                Start focus.
            {/if}
        {/if}
    </div>
</div>

<style>
    .popup {
        min-width: 250px;
    }
    .timer {
        background-color: var(--br-white);
        border-radius: var(--br-border-radius);
        color: var(--br-text);
        padding: 10px;
    }
    .timer :global(.timer) {
        font-weight: 400;
        font-size: 18px;
        letter-spacing: 0.5px;
    }
</style>