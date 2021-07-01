<script>
    import DisabledSetup from "./components/disabledSetup.svelte";
    import DisabledTransition from "./components/disabledTransition.svelte";
    import NextPhase from "./components/nextPhase.svelte";
    import { readable } from "svelte/store";
    import Running from "./components/running.svelte";
    import { setContext } from "svelte";
    import Setup from "./components/setup.svelte";
    import { timer } from "~@common/events";

    const state = readable({}, (set) => {
        timer.getState().then(set);
        timer.all((_, payload) => set(payload));
    });

    setContext("timer-state", state);
    setContext("script", "content");

    $: console.log({ $state });
    $: ({ status, phase, disabled } = $state);
</script>

<svelte:options tag="lisa-timer"/>

<link rel="stylesheet" href={chrome.runtime.getURL("content/index.css")}/>

{#if status === "setup"}
    <Setup/>
{:else if  status === "active"}
    {#if phase === "disabling"}
        <DisabledSetup/>
    {:else if phase === "transition"}
        <NextPhase/>
    {:else}
        <Running/>
    {/if}
{:else if status === "disabled"}
    {#if disabled == "transition"}
        <DisabledTransition/>
    {/if}
{/if}

<style>
    @media print {
        :host {
            display: none;
        }
    }
</style>