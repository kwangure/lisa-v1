<script>
    import Select, { Option } from "@kwangure/strawberry/components/Select";
    import settings, { close } from "../../background/settings";
    import { onDestroy } from "svelte";
    import { timerPositions } from "../../common/store/settings/default";

    onDestroy(close);
</script>

<Select bind:value={settings.appearanceSettings.timerPosition}>
    <span slot="label">Set timer position</span>
    {#each Object.values(timerPositions) as { value, name }}
        <Option {value}>{name}</Option>
    {/each}
</Select>