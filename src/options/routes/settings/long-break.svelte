<script>
    import settings, { close } from "../../../background/settings";
    import { Number } from "@kwangure/strawberry/components/Input";
    import { onDestroy } from "svelte";
    import Phase from "./_components/phase.svelte";

    onDestroy(close);
</script>

<Phase name="Long break" value={settings.phaseSettings.shortBreak}>
    <div class="form-item">
        <Number bind:value={settings.phaseSettings.longBreak.interval}
            min={0} max={10} readonly>
            <span slot="label">
                Long break interval
            </span>
        </Number>
    </div>
</Phase>