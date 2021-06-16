<script>
    import createSettingStore from "./settings";
    import Phase from "./_components/phase.svelte";

    const settingStore = createSettingStore();
</script>

<Phase name="Focus" bind:value={$settingStore.phaseSettings.focus}/>