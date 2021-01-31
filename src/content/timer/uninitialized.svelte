<script>
    import Button from "@kwangure/strawberry/components/Button";
    import Modal from "@kwangure/strawberry/components/Modal";
    import { timer } from "../../common/events";
</script>

<Modal visible>
    <div slot="content">
        <Button on:click={() => timer.start()}>Start timer</Button>
    </div>
</Modal>