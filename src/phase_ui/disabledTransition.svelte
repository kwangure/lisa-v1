<script>
    import Content from "./content/components/disabledTransition.svelte";

    export let script;
</script>

{#if script === "content"}
    <Content/>
{:else if script === "popup"}
    It's time to resume Lisa!
{/if}