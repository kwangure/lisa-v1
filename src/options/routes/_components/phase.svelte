<script>
    import { millisecondsToMinutes } from "../../../utils/time.js";
    import { notificationSounds } from "../../../common/audio";
    import { Number } from "@deimimi/strawberry/components/Input";
    import Select, { Option } from "@deimimi/strawberry/components/Select";

    export let name;
    export let value;

    function parseToMilliseconds(timeString) {
        return parseFloat(timeString) * ONE_MINUTE;
    }

    function formatToReadableTime(time) {
        return millisecondsToMinutes(time);
    }

    function formatIntervalCount(count) {
        return `${count} focus interval${count === 1 ? "" : "s"}`;
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
    {#if !isNaN(value.interval)}
        <Number bind:value={value.interval} label="Take a long break every"
            formatter={formatIntervalCount} min={0} max={10}
            parser={parseInt} step={1} stepOnly/>
    {/if}
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