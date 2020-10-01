<script>
    export let settingStore;
</script>

{#each Object.keys($settingStore.appearanceSettings) as appearance}
    {appearance}
{/each}

<script context="module">
    import { createSettingsWritable } from "../../common/store/settings";
    export async function preload() {
        const settingStore = await createSettingsWritable();
        return { settingStore };
    }
</script>