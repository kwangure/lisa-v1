<script>
    import { addHours, isBefore, isValid } from "date-fns";
    import Button from "@kwangure/strawberry/components/Button";
    import Time from "@kwangure/strawberry/components/Input/Time";

    export let timer;
    let disableTime = addHours(Date.now(), 1);

    $: if (isValid(disableTime) && isBefore(disableTime, Date.now())) {
        disableTime = addHours(disableTime, 24);
    }
</script>

<div class="content">
    <div class="form-item">
        Disable Lisa until
        <Time bind:value={disableTime} hideLabel>
            <span slot="label">Input extend duration</span>
        </Time>
    </div>
    <div class="form-item actions">
        <Button on:click={() => timer.disableStart(disableTime)}>
            Disable
        </Button>
        <Button primary on:click={() => timer.disableCancel()}>
            Cancel
        </Button>
    </div>
</div>

<style>
    .form-item:first-child {
        display: flex;
        align-items: center;
        gap: 1ch;
    }
    .content :global(input[type=radio]) {
        margin-right: 10px;
    }
    .form-item:not(.actions) {
        margin-bottom: 5px;
    }
    .actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 10px;
    }
    .actions :global(button) {
        flex: auto;
    }
    .actions :global(button:not(:first-child)) {
        margin-left: 5px;
    }
</style>