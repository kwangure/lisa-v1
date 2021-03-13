<script context="module">
    export function preload(context) {
        const { phase, timer: { position, remaining, state }} = context;

        return { phase, position, remaining, state };
    }
</script>

<script>
    import Content from "./content/components/running.svelte";
    import Popup from "./popup/components/running.svelte";

    export let script;
    export let phase;
    export let state;
    export let remaining;
    export let position;
</script>

{#if script === "content"}
    <Content {phase} {position} {remaining} {script} {state}/>
{:else if  script === "popup"}
    <Popup {phase} {remaining} {script}/>
{/if}