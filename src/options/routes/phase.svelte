<script>
    import { millisecondsToHumanReadableTime } from "../../utils/time.js";
    import { notificationSounds } from "../../common/audio";
    import { Number } from "@deimimi/strawberry/components/Input";
    import Select, { Option } from "@deimimi/strawberry/components/Select";

    export let name;
    export let value;

    function parseToMilliseconds(timeString) {
        return parseFloat(timeString) * ONE_MINUTE;
    }

    function formatToReadableTime(time) {
        return millisecondsToHumanReadableTime(time, function ({ minutes, seconds }) {
            const formattedSeconds = seconds === 0
                ? ""
                : String(seconds/60).replace(/^.*(?=\.)/, "");
            const isOneMinute = minutes === 1 && seconds === 0;
            const postFix = isOneMinute ? "minute": "minutes";
            return `${minutes}${formattedSeconds} ${postFix}`;
        });
    }

    function isInvalid(time) {
        const HUMAN_TIME = /\d*\.?\d+\s*minutes?/;
        const isInvalid = String(time).search(HUMAN_TIME) === -1;

        return isInvalid ? "Invalid time. Expected format: ## minutes": false;
    }

    const ONE_MINUTE = 60_000;
    const FIFTEEN_SECONDS = ONE_MINUTE/4;
</script>

<div class="phase">
    <h3>{name}</h3>
    <div class="form-item">
        <Number bind:value={value.duration} label="{name} phase duration"
            formatter={formatToReadableTime} min={FIFTEEN_SECONDS}
            {isInvalid} parser={parseToMilliseconds} step={ONE_MINUTE}/>
    </div>
    <div class="form-item">
        <Select bind:value={value.notification.sound} label="Notification tone after {name} phase">
            <Option value={null}>None</Option>
            {#each notificationSounds as sound}
                <Option value={sound.file}>{sound.name}</Option>
            {/each}
        </Select>
    </div>
</div>

<style>
    .form-item {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
    }
</style>