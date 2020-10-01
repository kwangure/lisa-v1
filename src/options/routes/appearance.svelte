<script>
    import Select, { Option } from "@deimimi/strawberry/components/Select";
    import { timerPositions } from "../../common/store/settings";
    
    export let settingStore;
</script>

<Select bind:value={$settingStore.appearanceSettings.timerPosition} 
    label="Set timer position">
    {#each Object.values(timerPositions) as { value, name }}
        <Option {value}>{name}</Option>
    {/each}
</Select>

<script context="module">
    import { createSettingsWritable } from "../../common/store/settings";
    export async function preload() {
        const settingStore = await createSettingsWritable();
        return { settingStore };
    }
</script>