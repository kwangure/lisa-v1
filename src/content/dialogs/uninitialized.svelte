<script>
    import Button from "@kwangure/strawberry/components/Button";
    import Modal from "@kwangure/strawberry/components/Modal";
    import { timer } from "../../common/events";

    export let script;
</script>

{#if script === "content"}
    <Modal visible>
        <div slot="content">
            <Button on:click={() => timer.start()}>Start timer</Button>
        </div>
    </Modal>
{/if}