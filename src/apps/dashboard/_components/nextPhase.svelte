<script>
    import Radio, { Group } from "@kwangure/strawberry/components/Input/Radio";
    import Button from "@kwangure/strawberry/components/Button";
    import Icon from "@kwangure/strawberry/components/Icon";
    import { mdiInformationOutline } from "@mdi/js";
    import Number from "@kwangure/strawberry/components/Input/Number";
    import { phaseNames } from "~@common/settings";

    export let timer;

    $: ({
        completedPhase: { name: completedPhase },
        focusPhasesSinceStart,
        focusPhasesUntilLongBreak,
        nextPhase,
    } = $timer);

    let nextStep = "proceed";
    let extendDurationMins = 5;
    $: extendedDurationMs = extendDurationMins * 60 * 1000;

    $: nextPhaseName = phaseNames[nextPhase].toLowerCase();
    $: completedPhaseName = phaseNames[completedPhase].toLowerCase();
</script>

<div class="content">
    <div class="form-item">
        What would you like to do?
    </div>
    <div class="form-item">
        <Group bind:value={nextStep}>
            <Radio value="extend">
                <span slot="label">
                    Extend {completedPhaseName} by
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
        {#if focusPhasesUntilLongBreak === 0}
            You have completed {focusPhasesSinceStart} focus sessions!
        {:else}
            You have {focusPhasesUntilLongBreak} focus sessions until the long break.
        {/if}
    </div>
    <div class="form-item">
        {#if nextStep === "extend"}
            <Button fullwidth on:click={() => timer.extendPrevious(extendedDurationMs)}>
                Extend {completedPhaseName}
            </Button>
        {:else if nextStep === "proceed"}
            <Button fullwidth on:click={() => timer.nextPhase()}>
                Continue to {nextPhaseName}
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