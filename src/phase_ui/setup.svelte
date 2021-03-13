<script>
    import Content from "./content/components/setup.svelte";

    export let script;
</script>

{#if script === "content"}
    <Content/>
{:else if script === "popup"}
    You've not yet started Lisa.
{/if}
