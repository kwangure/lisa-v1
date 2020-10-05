<script>
    import { Number, Radio } from "@deimimi/strawberry/components/Input";
    import { phaseNames } from "../../common/store/settings/default";
    import { mdiInformationOutline } from "@mdi/js";
    import { millisecondsToMinutes } from "../../utils/time";
    import { timer } from "../../common/events";
    import Button from "@deimimi/strawberry/components/Button";
    import Icon from "@deimimi/strawberry/components/Icon";
    import Modal from "@deimimi/strawberry/components/Modal";

    export let focusPhasesSinceStart;
    export let focusPhasesUntilLongBreak;
    export let nextPhase;
    export let previousPhase;

    $: nextPhaseName = phaseNames[nextPhase].toLowerCase();
    $: previousPhaseName = phaseNames[previousPhase].toLowerCase();

    const ONE_SECOND = 1000;
    const ONE_MINUTE = ONE_SECOND * 60
    const FIVE_MINUTES = ONE_MINUTE * 5;

    let extendDuration = FIVE_MINUTES;
    let group = "proceed";

    function parseToMilliseconds(timeString) {
        return parseFloat(timeString) * ONE_MINUTE;
    }

    function isInvalid(time) {
        const HUMAN_TIME = /\d*\.?\d+\s*minutes?/;
        const isInvalid = String(time).search(HUMAN_TIME) === -1;

        return isInvalid ? "Invalid time. Expected format: ## minutes": false;
    }
</script>

<Modal visible closable="{false}">
    <div slot="content">
        <div class="form-item">
            What would you like to do?
        </div>
        <div class="form-item">
            <Radio bind:group value="extend">
                <span slot="label">
                    <Number bind:value={extendDuration} formatter={millisecondsToMinutes}
                    on:focus={() => group = "extend"} 
                    label="Extend {previousPhaseName} by" min={0}
                    parser={parseToMilliseconds} {isInvalid} step={ONE_MINUTE}/>
                </span>
            </Radio>
        </div>
        <div class="form-item">
            <Radio bind:group value="proceed">
                <span slot="label">
                    Proceed to {nextPhaseName}
                </span>
            </Radio>
        </div>
        <div class="form-item tip">
            <Icon path={mdiInformationOutline} size="16"/>
            You have {focusPhasesUntilLongBreak} focus sessions until the long break.
        </div>
        <div class="form-item">
            {#if group === "extend"}
                <Button fullwidth on:click={() => timer.extendPrevious(extendDuration)}>
                    Extend {previousPhaseName}
                </Button>
            {:else if group === "proceed"}
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