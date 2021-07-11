<script context="module">
    import { setup } from "../setup.js";

    export async function preload() {
        const returning = { timer: await setup() };
        console.log("running preload", { returning });
        return returning;
    }
</script>

<script>
    import Disabled from "./components/disabled.svelte";
    import DisabledSetup from "./components/disabledSetup.svelte";
    import DisabledTransition from "./components/disabledTransition.svelte";
    import NextPhase from "./components/nextPhase.svelte";
    import Running from "./components/running.svelte";
    import Setup from "./components/setup.svelte";

    export let timer;

    $: console.log({ timer });

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

