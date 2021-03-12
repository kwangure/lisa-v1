<script context="module">
    export function preload(context) {
        const { timer: { position, positionUpdate }} = context;

        return {
            previousPosition: position,
            currentPosition: positionUpdate,
        };
    }
</script>

<script>
    import Button from "@kwangure/strawberry/components/Button";
    import Modal from "@kwangure/strawberry/components/Modal";
    import { timer } from "../../common/events";

    function name(position) {
        return position.replace("-", " ");
    }

    export let script;
    export let previousPosition;
    export let currentPosition;
</script>

{#if script === "content"}
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
{/if}