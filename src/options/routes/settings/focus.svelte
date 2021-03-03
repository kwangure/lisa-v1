<script context="module">
    import preload from "./preload.js";

    export { preload };
</script>

<script>
    import Phase from "./_components/phase.svelte";
    import { updateSettings } from "../../../background/settings-2";

    export let settings;

    $: updateSettings(settings);
</script>

<Phase name="Focus" bind:value={settings.phaseSettings.focus}/>