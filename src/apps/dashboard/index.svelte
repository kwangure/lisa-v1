<script context="module">
    import { createTimerStore } from "./timer.js";

    export async function load() {
        return {
            props: {
                timer: await createTimerStore(),
            },
        };
    }
</script>

<script>
    import Disabled from "./_components/disabled.svelte";
    import DisabledSetup from "./_components/disabledSetup.svelte";
    import DisabledTransition from "./_components/disabledTransition.svelte";
    import NextPhase from "./_components/nextPhase.svelte";
    import Running from "./_components/running.svelte";
    import Setup from "./_components/setup.svelte";

    export let timer;

    $: ({ status, phaseMachine, disabledMachine } = $timer || {});
</script>

{#if status === "loading"}
    Lisa is loading...
{:else}
    {#if status === "setup"}
        <Setup {timer}/>
    {:else if  status === "active"}
        {#if phaseMachine.currentPhase === "disabling"}
            <DisabledSetup {timer}/>
        {:else if phaseMachine.currentPhase === "transition"}
            <NextPhase/>
        {:else}
            <Running {timer}/>
        {/if}
    {:else if status === "disabled"}
        {#if disabledMachine.currentPhase == "default"}
            <Disabled {timer}/>
        {:else if disabledMachine.currentPhase == "transition"}
            <DisabledTransition {timer}/>
        {/if}
    {/if}
{/if}

