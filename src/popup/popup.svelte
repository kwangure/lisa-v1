<script>
    import Disabled from "./components/disabled.svelte";
    import Item from "./components/item.svelte";
    import open from "~@common/page/open";
    import { phaseNames } from "~@common/settings";
    import { readable } from "svelte/store";
    import Running from "./components/running.svelte";
    import { setContext } from "svelte";
    import { timer } from "~@common/events";

    const state = readable({}, (set) => {
        timer.getState().then(set);
        timer.all((_, payload) => set(payload));
    });

    setContext("timer-state", state);

    $: ({ disabled, phase, status, nextPhase } = $state);
    $: nextPhaseName = phaseNames[nextPhase]?.toLowerCase();

    function showOptions() {
        open.options();
    }
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
    <Item on:click={showOptions}>
        Open settings page
    </Item>
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