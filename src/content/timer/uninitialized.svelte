<script>
    import { timer } from "../../common/events";
    import Button from "@kwangure/strawberry/components/Button";
    import Modal from "@kwangure/strawberry/components/Modal";
</script>

<Modal visible>
    <div slot="content">
        <Button on:click={() => timer.start()}>Start timer</Button>
    </div>
</Modal>