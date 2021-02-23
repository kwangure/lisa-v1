<script context="module">
    import preload from "./preload.js";

    export { preload };
</script>

<script>
    import Phase from "./_components/phase.svelte";

    export let settingStore;
</script>

<Phase name="Focus" bind:value={$settingStore.phaseSettings.focus}/>