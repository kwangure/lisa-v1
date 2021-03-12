<script>
    import { millisecondsToHumanReadableTime } from "../../../utils/time";
    import Timer from "./timer.svelte";

    export let script;
    export let remaining;
    export let phase;

    $: time = millisecondsToHumanReadableTime(remaining);
</script>

<Timer {phase} {script} {time}/>