<script>
    import Button from "@kwangure/strawberry/components/Button";
    import Modal from "@kwangure/strawberry/components/Modal";
    import { millisecondsToMinutes as mtm } from "../../utils/time";
    import { timer } from "../../common/events";

    export let phase;
    export let previousDuration;
    export let currentDuration;
</script>

<Modal visible>
    <div slot="content">
        The duration setting for {phase} sessions has changed from
        {mtm(previousDuration)} to {mtm(currentDuration)}.
        What do you want to do?
        <div>
            <Button on:click={() => timer.saveUpdate()}>
                Change current session to {mtm(currentDuration)}.
            </Button>
        </div>
        <div>
            <Button on:click={() => timer.ignoreUpdate()}>
                Leave current session as {mtm(previousDuration)}.
            </Button>
        </div>
    </div>
</Modal>