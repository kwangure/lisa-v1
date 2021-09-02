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

    $: isLoading = $timer === null;
    $: ({ state } = $timer || {})
    $: ({ status, phase, disabled } = $state || {});
</script>

{#if isLoading}
    Lisa is loading...
{:else}
    {#if status === "setup"}
        <Setup timer={$timer}/>
    {:else if  status === "active"}
        {#if phase === "disabling"}
            <DisabledSetup timer={$timer}/>
        {:else if phase === "transition"}
            <NextPhase/>
        {:else}
            <Running timer={$timer}/>
        {/if}
    {:else if status === "disabled"}
        {#if disabled == "default"}
            <Disabled timer={$timer}/>
        {:else if disabled == "transition"}
            <DisabledTransition timer={$timer}/>
        {/if}
    {/if}
{/if}

