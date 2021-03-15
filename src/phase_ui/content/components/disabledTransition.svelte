<script>
    import Radio, { Group } from "@kwangure/strawberry/components/Input/Radio";
    import Button from "@kwangure/strawberry/components/Button";
    import Modal from "@kwangure/strawberry/components/Modal";
    import { Number } from "@kwangure/strawberry/components/Input";
    import { timer } from "../../../common/events";

    let nextStep = "focus";
    let disabledDurationMins = 5;
    $: disabledDurationMs = disabledDurationMins * 60 * 1000;
</script>

<Modal visible closable="{false}">
    <div slot="content">
        <div class="form-item">
            What would you like to do?
        </div>
        <div class="form-item">
            <Group bind:value={nextStep}>
                <Radio value="disable">
                    <span slot="label">
                        Disable Lisa for another
                        <Number bind:value={disabledDurationMins} min=0 hideLabel>
                            <span slot="label">Input disable duration</span>
                        </Number>
                        minutes
                    </span>
                </Radio>
                <Radio  value="focus">
                    <span slot="label">
                        Start a new focus cycle
                    </span>
                </Radio>
            </Group>
        </div>
        <div class="form-item">
            {#if nextStep === "disable"}
                <Button fullwidth on:click={() => timer.disableStart(disabledDurationMs)}>
                    Disable Lisa
                </Button>
            {:else if nextStep === "focus"}
                <Button fullwidth on:click={() => timer.disableEnd()}>
                    Continue to focus
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
        margin-bottom: 5px;
    }
</style>