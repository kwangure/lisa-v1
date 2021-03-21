<script>
    import Content from "~@content/components/disabledSetup.svelte";

    export let script;
</script>

{#if script === "content"}
    <Content/>
{:else if script === "popup"}
    You're about to disable Lisa.
{/if}