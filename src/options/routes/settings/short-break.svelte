<script context="module">
    import preload from "./preload.js";

    export { preload };
</script>

<script>
    import Phase from "./_components/phase.svelte";

    export let settingStore;
</script>

<Phase name="Short break" bind:value={$settingStore.phaseSettings.shortBreak}/>