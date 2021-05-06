<script>
    import { format } from "date-fns";
    import Timer from "~@phase_ui/components/running/timer.svelte";

    export let script;
    export let disabledEnd;
    export let remaining;
    export let phase;
    export let status;

    $: disabledPopup = script === "popup" && status === "disabled";
    $: disabledEndTime = format(new Date(disabledEnd), "h:mm bbb");
</script>

<div class="popup">
    {#if disabledPopup}
        <span class="title">DISABLED UNTIL</span>
        <Timer {phase} {script} {status} time={disabledEndTime}/>
    {:else}
        <Timer {phase} {script} {status} time={remaining}/>
    {/if}
</div>

<style>
    .title {
        line-height: 2;
        color: var(--br-grey-dark);
        font-size: 12px;
        font-weight: 600;
    }
</style>
