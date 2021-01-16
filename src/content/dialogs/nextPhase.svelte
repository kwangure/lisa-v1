<script>
    import { phaseNames } from "../../common/store/settings/default";
    import { mdiInformationOutline } from "@mdi/js";
    import { millisecondsToMinutes } from "../../utils/time";
    import { timer } from "../../common/events";
    import Button from "@kwangure/strawberry/components/Button";
    import Icon from "@kwangure/strawberry/components/Icon";
    import Modal from "@kwangure/strawberry/components/Modal";
    import { Number } from "@kwangure/strawberry/components/Input";
    import Radio, { Group } from "@kwangure/strawberry/components/Input/Radio";

    export let focusPhasesSinceStart;
    export let focusPhasesUntilLongBreak;
    export let nextPhase;
    export let previousPhase;

    $: nextPhaseName = phaseNames[nextPhase].toLowerCase();
    $: previousPhaseName = phaseNames[previousPhase].toLowerCase();

    const ONE_SECOND = 1000;
    const ONE_MINUTE = ONE_SECOND * 60;
    const FIVE_MINUTES = ONE_MINUTE * 5;

    let extendDuration = FIVE_MINUTES;
    let nextStep = "proceed";
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
                        <Number bind:value={extendDuration}
                            on:focus={() => nextStep = "extend"} min={0}
                            step={ONE_MINUTE}>
                            <span slot="label">Extend {previousPhaseName} by</span>
                        </Number>
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
                <Button fullwidth on:click={() => timer.extendPrevious(extendDuration)}>
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
    [slot=content] :global(.berry-input-number) {
        display: flex !important;
    }
    [slot=content] :global(.berry-input-radio),
    [slot=content] :global(.berry-input-number) {
        align-items: center;
    }
    [slot=content] :global(.berry-input-number label) {
        margin-bottom: 0 !important;
    }
    [slot=content] :global(.berry-input-radio input),
    [slot=content] :global(.berry-input-number label) {
        margin-right: 10px;
    }
    .form-item:not(:last-child) {
        padding: 3px 0;
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