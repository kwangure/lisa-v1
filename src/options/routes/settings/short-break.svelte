<script context="module">
    import preload from "./preload.js";

    export { preload };
</script>

<script>
    import Phase from "./_components/phase.svelte";
    import { updateSettings } from "../../../background/settings";

    export let settings;

    $: updateSettings(settings);
</script>

<Phase name="Short break" bind:value={settings.phaseSettings.shortBreak}/>