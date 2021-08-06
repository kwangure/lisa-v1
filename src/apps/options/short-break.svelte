<script>
    import createSettingStore from "./settings";
    import Phase from "./_components/phase.svelte";

    const settingStore = createSettingStore();
</script>

<Phase name="Short break" bind:value={$settingStore.phaseSettings.shortBreak}/>