<script>
    import { timer } from "../../common/events";
    import Button from "@deimimi/strawberry/components/Button";
    import Modal from "@deimimi/strawberry/components/Modal";

    export let phase;
</script>

<Modal visible closable={false}>
    <div slot="content">
        <div class="modal-item">
            You have been paused for more than 3 minutes.
        </div>
        <div class="modal-item">
            <Button primary fullwidth on:click={timer.play}>
                Resume {phase}
            </Button>
        </div>
        <div class="modal-item">
            <Button fullwidth on:click={timer.pause}>Stay paused</Button>
        </div>
    </div>
</Modal>

<style>
    [slot=content] {
        line-height: 2;
    }
    .modal-item:not(:last-child) {
        margin-bottom: 10px;
    }
</style>