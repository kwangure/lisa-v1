<script>
    import Radio, { Group } from "@kwangure/strawberry/components/Input/Radio";
    import Button from "@kwangure/strawberry/components/Button";
    import Modal from "@kwangure/strawberry/components/Modal";
    import { Number } from "@kwangure/strawberry/components/Input";
    import { timer } from "~@common/events";

    let nextStep = "activate";

    let disableDurationMins = 5;
    $: extendedDurationMs = disableDurationMins * 60 * 1000;
</script>

<Modal visible closable="{false}">
    <div slot="content">
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
                        Disable Lisa for
                        <Number bind:value={disableDurationMins} min=0 hideLabel>
                            <span slot="label">Input extend duration</span>
                        </Number>
                        minutes
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
                <Button primary fullwidth on:click={() => timer.disableStart(extendedDurationMs)}>
                    Disable Lisa
                </Button>
            {/if}
        </div>
    </div>
</Modal>

<style>
    [slot=content] :global(.berry-input-radio) {
        margin-bottom: 10px;
    }
    [slot=content] :global(.berry-input-radio),
    [slot=content] :global(.berry-input-radio [slot=label]) {
        display: flex;
        align-items: center;
    }
    [slot=content] :global([slot=label] .berry-input-number) {
        width: auto;
        margin-left: 1ch;
        margin-right: 1ch;
    }
    [slot=content] :global(input[type=radio]) {
        margin-right: 10px;
    }
    .form-item {
        margin-bottom: 10px;
    }
</style>