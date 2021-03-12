<script context="module">
    export function preload(context) {
        const { phase, timer: { position, remaining, state }} = context;

        return { phase, position, remaining, state };
    }
</script>

<script>
    import Content from "./components/content.svelte";
    import Popup from "./components/popup.svelte";

    export let script;
    export let phase;
    export let state;
    export let remaining;
    export let position;

    $: console.log({ position });
</script>

{#if script === "content"}
    <Content {phase} {position} {remaining} {script} {state}/>
{:else if  script === "popup"}
    <Popup {phase} {remaining} {script}/>
{/if}