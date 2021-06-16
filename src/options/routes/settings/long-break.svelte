<script>
    import createSettingStore from "./settings";
    import { Number } from "@kwangure/strawberry/components/Input";
    import Phase from "./_components/phase.svelte";

    const settingStore = createSettingStore();
</script>

<Phase name="Long break" bind:value={$settingStore.phaseSettings.longBreak}>
    <div class="form-item">
        <Number bind:value={$settingStore.phaseSettings.longBreak.interval}
            min={0} max={10} readonly>
            <span slot="label">
                Long break interval
            </span>
        </Number>
    </div>
</Phase>