<script>
    import Radio, { Group } from "@kwangure/strawberry/components/Input/Radio";
    import Button from "@kwangure/strawberry/components/Button";
    import Icon from "@kwangure/strawberry/components/Icon";
    import { mdiInformationOutline } from "@mdi/js";
    import Modal from "@kwangure/strawberry/components/Modal";
    import { Number } from "@kwangure/strawberry/components/Input";
    import { phaseNames } from "../../common/store/settings/default";
    import { timer } from "../../common/events";

    export let focusPhasesUntilLongBreak;
    export let nextPhase;
    export let previousPhase;

    let extendDurationMins = 5;
    let nextStep = "proceed";

    $: extendedDurationMs = extendDurationMins * 60 * 1000;
    $: nextPhaseName = phaseNames[nextPhase].toLowerCase();
    $: previousPhaseName = phaseNames[previousPhase].toLowerCase();
</script>

<Modal visible closable="{false}">
    <div slot="content">
        <div class="form-item">
            What would you like to do?
        </div>
        <div class="form-item">
            <Group bind:value={nextStep}>
                <Radio value="extend">
                    <span slot="label">
                        Extend {previousPhaseName} by
                        <Number bind:value={extendDurationMins} min=0 hideLabel>
                            <span slot="label">Input extend duration</span>
                        </Number>
                        minutes
                    </span>
                </Radio>
                <Radio  value="proceed">
                    <span slot="label">
                        Proceed to {nextPhaseName}
                    </span>
                </Radio>
            </Group>
        </div>
        <div class="form-item tip">
            <Icon path={mdiInformationOutline} size="16"/>
            You have {focusPhasesUntilLongBreak} focus sessions until the long break.
        </div>
        <div class="form-item">
            {#if nextStep === "extend"}
                <Button fullwidth on:click={() => timer.extendPrevious(extendedDurationMs)}>
                    Extend {previousPhaseName}
                </Button>
            {:else if nextStep === "proceed"}
                <Button fullwidth on:click={timer.nextPhase}>
                    Continue to {nextPhaseName}
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
    .tip {
        margin-top: 15px;
        display: flex;
        align-items: center;
        font-size: 12px;
    }
    .tip :global(.berry-icon) {
        margin: 0 6px 0 4px;
        color: var(--br-primary);
    }
</style>