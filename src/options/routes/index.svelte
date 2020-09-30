<script>
    import Phase from "./_components/phase.svelte";
    
    export let settingStore;
</script>

{#each Object.keys($settingStore.phaseSettings) as phase}
    <Phase name="{phase}" bind:value={$settingStore.phaseSettings[phase]}/>
{/each}

<script context="module">
    import { createSettingsWritable } from "../../common/store/settings.js";
    export async function preload() {
        const settingStore = await createSettingsWritable();
        
        return { settingStore };
    }
</script>