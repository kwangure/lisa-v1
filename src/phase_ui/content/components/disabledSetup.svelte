<script>
    import Button from "@kwangure/strawberry/components/Button";
    import Modal from "@kwangure/strawberry/components/Modal";
    import { Number } from "@kwangure/strawberry/components/Input";
    import { timer } from "../../../common/events";

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
        <div class="form-item">
            <Button primary fullwidth on:click={() => timer.disableStart(disableDurationMs)}>
                Disable
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
    .form-item {
        margin-bottom: 5px;
    }
</style>