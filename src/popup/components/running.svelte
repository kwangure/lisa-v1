<script>
    import { getContext } from "svelte";
    import { millisecondsToHumanReadableTime } from "~@utils/time";
    import Timer from "~@phase_ui/components/timer.svelte";

    const state = getContext("timer-state");

    let remaining;
    $: ({ timerMachine: { remaining }} = $state);
    $: time = millisecondsToHumanReadableTime(remaining);
</script>

<Timer {time}/>
