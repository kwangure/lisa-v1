<script context="module">
    export function preload(context) {
        const { name: phase, timer: { pauseDuration }} = context;

        return { phase, pauseDuration };
    }
</script>

<script>
    import Button from "@kwangure/strawberry/components/Button";
    import { millisecondsToHumanReadableTime } from "../../utils/time";
    import Modal from "@kwangure/strawberry/components/Modal";
    import { phaseNames } from "../../common/store/settings/default";
    import { timer } from "../../common/events";

    export let phase;
    export let pauseDuration;

    const phaseName = phaseNames[phase].toLowerCase();
</script>

<Modal visible closable={false}>
    <div slot="content">
        <div class="modal-item">
            You have been paused for more than
            {millisecondsToHumanReadableTime(pauseDuration, (time) => {
                const { minutes, seconds } = time;

                let timeString = "";
                if (minutes > 0) {
                    timeString += `${minutes} minute${minutes === 1? "": "s"} `;
                }
                if (seconds > 0) {
                    timeString += `${seconds} second${seconds === 1? "": "s"} `;
                }

                return timeString.trim();
            })}.
        </div>
        <div class="modal-item">
            <Button primary fullwidth on:click={() => timer.play()}>
                Resume {phaseName}
            </Button>
        </div>
        <div class="modal-item">
            <Button fullwidth on:click={() => timer.pauseDefault()}>
                Stay paused
            </Button>
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