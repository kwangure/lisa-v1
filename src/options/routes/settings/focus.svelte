<script>
    import settings, { close } from "../../../background/settings";
    import { onDestroy } from "svelte";
    import Phase from "./_components/phase.svelte";

    onDestroy(close);
</script>

<Phase name="Focus" value={settings.phaseSettings.focus}/>