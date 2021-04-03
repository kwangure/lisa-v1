<script context="module">
    import createSettingStore from "./settings";
    export async function preload() {
        return {
            settingStore: await createSettingStore(),
        };
    }
</script>

<script>
    import Select, { Option } from "@kwangure/strawberry/components/Select";
    import { timerPositions } from "../../../common/settings";

    export let settingStore;
</script>

<Select bind:value={$settingStore.appearanceSettings.timerPosition}>
    <span slot="label">Set timer position</span>
    {#each Object.values(timerPositions) as { value, name }}
        <Option {value}>{name}</Option>
    {/each}
</Select>