<script context="module">
    import { setup } from "./setup.js";

    export async function load() {
        return {
            props: {
                timer: await setup()
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
    $: ({ status, phase, disabled } = $timer || {});
</script>

{#if isLoading}
    Lisa is loading...
{:else}
    {#if status === "setup"}
        <Setup {timer}/>
    {:else if  status === "active"}
        {#if phase === "disabling"}
            <DisabledSetup {timer}/>
        {:else if phase === "transition"}
            <NextPhase/>
        {:else}
            <Running {timer}/>
        {/if}
    {:else if status === "disabled"}
        {#if disabled == "default"}
            <Disabled {timer}/>
        {:else if disabled == "transition"}
            <DisabledTransition {timer}/>
        {/if}
    {/if}
{/if}

