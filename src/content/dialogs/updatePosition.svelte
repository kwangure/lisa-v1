<script>
    import { timer } from "../../common/events";
    import Button from "@kwangure/strawberry/components/Button";
    import Modal from "@kwangure/strawberry/components/Modal";

    function name(position) {
        return position.replace("-", " ");
    }

    export let previousPosition;
    export let currentPosition;
</script>

<Modal visible>
    <div slot="content">
        The timer position settings was changed from {name(previousPosition)} to {name(currentPosition)}.
        What do you want to do?
        <div>
            <Button on:click={() => timer.savePositionUpdate()}>
                Change timer position to {name(currentPosition)}.
            </Button>
        </div>
        <div>
            <Button on:click={() => timer.ignorePositionUpdate()}>
                Leave timer as {name(previousPosition)}.
            </Button>
        </div>
    </div>
</Modal>