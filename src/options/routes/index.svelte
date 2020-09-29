<script>
    import { createSettingsWritable } from "../../common/store/settings.js";
    import Phase from "./phase.svelte";

    let settingStore = createSettingsWritable();
</script>

{#each Object.keys($settingStore.phaseSettings) as phase}
    <Phase name="{phase}" bind:value={$settingStore.phaseSettings[phase]}/>
{/each}