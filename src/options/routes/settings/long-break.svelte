<script context="module">
    import preload from "./preload.js";

    export { preload };
</script>

<script>
    import { Number } from "@kwangure/strawberry/components/Input";
    import Phase from "./_components/phase.svelte";
    import { updateSettings } from "../../../background/settings";

    export let settings;

    $: updateSettings(settings);
</script>

<Phase name="Long break" bind:value={settings.phaseSettings.longBreak}>
    <div class="form-item">
        <Number bind:value={settings.phaseSettings.longBreak.interval}
            min={0} max={10} readonly>
            <span slot="label">
                Long break interval
            </span>
        </Number>
    </div>
</Phase>