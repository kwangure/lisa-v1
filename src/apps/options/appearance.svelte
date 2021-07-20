<script>
    import Select, { Option } from "@kwangure/strawberry/components/Select";
    import createSettingStore from "./settings";
    import { timerPositions } from "~@common/settings";

    const settingStore = createSettingStore();
</script>

<Select bind:value={$settingStore.appearanceSettings.timerPosition}>
    <span slot="label">Set timer position</span>
    {#each Object.values(timerPositions) as { value, name }}
        <Option {value}>{name}</Option>
    {/each}
</Select>