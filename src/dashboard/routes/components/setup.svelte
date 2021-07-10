<script>
    import { addHours, isBefore, isValid } from "date-fns";
    import Radio, { Group } from "@kwangure/strawberry/components/Input/Radio";
    import Button from "@kwangure/strawberry/components/Button";
    import Time from "@kwangure/strawberry/components/Input/Time";

    export let timer;

    let nextStep = "activate";
    let disableTime = addHours(Date.now(), 1);

    $: if (isValid(disableTime) && isBefore(disableTime, Date.now())) {
        disableTime = addHours(disableTime, 24);
    }
</script>

<div class="content">
    <div class="form-item">
        You've not started Lisa yet. What would you like to do?
    </div>
    <div class="form-item">
        <Group bind:value={nextStep}>
            <Radio  value="activate">
                <span slot="label">
                    Start crushing your day! 🚀
                </span>
            </Radio>
            <Radio value="disable">
                <span slot="label">
                    Disable Lisa until
                    <Time bind:value={disableTime} hideLabel>
                        <span slot="label">Input extend duration</span>
                    </Time>
                </span>
            </Radio>
        </Group>
    </div>
    <div class="form-item">
        {#if nextStep === "activate"}
            <Button primary fullwidth on:click={() => timer.start()}>
                Start Lisa
            </Button>
        {:else if nextStep === "disable"}
            <Button primary fullwidth on:click={() => timer.disableStart(disableTime)}>
                Disable Lisa
            </Button>
        {/if}
    </div>
</div>

<style>
    .content :global(.berry-input-radio) {
        margin-bottom: 10px;
    }
    .content :global(.berry-input-radio),
    .content :global(.berry-input-radio [slot=label]) {
        display: flex;
        align-items: center;
        gap: 1ch;
    }
    .form-item {
        margin-bottom: 10px;
    }
</style>