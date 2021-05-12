<script>
    import { format } from "date-fns";
    import { getContext } from "svelte";
    import Timer from "~@phase_ui/components/timer.svelte";

    const state = getContext("timer-state");

    let disabledEnd;
    $: ({ timerMachine: { disabledEnd }} = $state);
    $: disabledEndTime = format(new Date(disabledEnd), "h:mm bbb");
</script>

<span class="title">DISABLED UNTIL</span>
<Timer time={disabledEndTime}/>

<style>
    .title {
        line-height: 2;
        color: var(--br-grey-dark);
        font-size: 12px;
        font-weight: 600;
    }
</style>
