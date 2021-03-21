<script>
    import Button from "@kwangure/strawberry/components/Button";
    import Modal from "@kwangure/strawberry/components/Modal";
    import { Number } from "@kwangure/strawberry/components/Input";
    import { timer } from "~@common/events";

    let disableDurationMins = 60;
    $: disableDurationMs = disableDurationMins * 60 * 1000;
</script>

<Modal visible closable="{false}">
    <div slot="content">
        <div class="form-item">
            Disable Lisa for
            <Number bind:value={disableDurationMins} min=0 hideLabel>
                <span slot="label">Input extend duration</span>
            </Number>
            minutes
        </div>
        <div class="form-item actions">
            <Button on:click={() => timer.disableStart(disableDurationMs)}>
                Disable
            </Button>
            <Button primary on:click={() => timer.disableCancel()}>
                Cancel
            </Button>
        </div>
    </div>
</Modal>

<style>
    .form-item:first-child {
        display: flex;
        align-items: center;
    }
    [slot=content] :global(.berry-input-number) {
        width: auto;
        margin-left: 1ch;
        margin-right: 1ch;
    }
    [slot=content] :global(input[type=radio]) {
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