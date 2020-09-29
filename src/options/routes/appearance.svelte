<script>
    import { createSettingsWritable } from "../../common/store/settings.js";
    import Phase from "./_components/phase.svelte";

    let settingStore = createSettingsWritable();
</script>
{#each Object.keys($settingStore.appearanceSettings) as phase}
    <Phase name="{phase}" bind:value={$settingStore.appearanceSettings[phase]}/>
{/each}