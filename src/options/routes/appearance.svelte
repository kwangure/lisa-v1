<script>
    import Select, { Option } from "@kwangure/strawberry/components/Select";
    import { timerPositions } from "../../common/store/settings";

    export let settingStore;
</script>

<Select bind:value={$settingStore.appearanceSettings.timerPosition}>
    <span slot="label">Set timer position</span>
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