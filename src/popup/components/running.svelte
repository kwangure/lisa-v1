<script>
    import { formatMilliseconds } from "~@utils/time";
    import { getContext } from "svelte";
    import Timer from "~@phase_ui/components/timer.svelte";

    const state = getContext("timer-state");

    let remaining;
    $: ({ timerMachine: { remaining }} = $state);
    $: time = formatMilliseconds(remaining, {
        format: ["minutes", "seconds"],
        delimiter: ":",
        formatter: { xHours: "", xMinutes: "", xSeconds: "" },
        zero: true,
        pad: true,
    });
</script>

<Timer {time}/>
