<script>
    import { millisecondsToHumanReadableTime } from "../../../utils/time";
    import Timer from "../../components/running/timer.svelte";

    export let script;
    export let remaining;
    export let phase;
    export let status;

    $: time = millisecondsToHumanReadableTime(remaining);
</script>

<Timer {phase} {script} {status} {time}/>