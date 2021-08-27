<script>
    import { format } from "date-fns";

    export let timer;

    const { state } = timer;

    let disabledEnd;
    $: ({ timerMachine: { disabledEnd }} = $state);
    $: disabledEndTime = format(new Date(disabledEnd), "h:mm bbb");
</script>

<span class="title">DISABLED UNTIL</span>
<div class="timer">
    {disabledEndTime}
</div>

<style>
    .title {
        line-height: 2;
        color: var(--br-grey-dark);
        font-size: 12px;
        font-weight: 600;
    }
    .timer {
        font-weight: 600;
        line-height: 50px;
        padding: 0 20px;
        border-radius: var(--br-border-radius);
        cursor: pointer;
        text-align: center;
        background-color: var(--br-red-light);
        color: var(--br-red);
    }
</style>
