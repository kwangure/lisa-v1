<script context="module">
    export function preload(context) {
        const { phase, timerMachine: { position, remaining, state }, status } = context;

        return { phase, position, remaining, state, status };
    }
</script>

<script>
    import Content from "~@content/components/running.svelte";
    import Popup from "~@popup/components/running.svelte";

    export let script;
    export let phase;
    export let state;
    export let status;
    export let remaining;
    export let position;
</script>

{#if script === "content" && status !== "disabled"}
    <Content {phase} {position} {remaining} {script} {state}/>
{:else if  script === "popup"}
    <Popup {phase} {remaining} {script} {status}/>
{/if}