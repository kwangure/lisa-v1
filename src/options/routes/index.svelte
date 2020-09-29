<script>
    import { createSettingsWritable } from "../../common/store/settings.js";
    import { readable } from "svelte/store";
    import Phase from "./phase.svelte";

    let settingStore = readable({});
    (async() => {
        settingStore = await createSettingsWritable();
    })();
</script>

{#each Object.keys($settingStore) as phase}
    <Phase name="{phase}" bind:value={$settingStore[phase]}/>
{/each}