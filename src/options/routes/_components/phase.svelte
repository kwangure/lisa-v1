<script>
    import { millisecondsToMinutes } from "../../../utils/time.js";
    import { mdiVolumeHigh } from "@mdi/js";
    import { notificationSounds } from "../../../common/audio";
    import { Number } from "@deimimi/strawberry/components/Input";
    import { fade } from "svelte/transition";
    import Select, { Option } from "@deimimi/strawberry/components/Select";
    import Icon from "@deimimi/strawberry/components/Icon";

    export let name;
    export let value;

    let audioPlaying;

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

    function playAudio(event) {
        if (typeof event.detail === "string") {
            const audio = new Audio(event.detail);
            audioPlaying = new Promise((resolve) => {
                audio.onended = () => resolve();
                audio.play();
            });
        }
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
        <Select bind:value={value.notification.sound} label="Notification tone after {name} phase"
        on:change={playAudio}>
            <Option value={null}>None</Option>
            {#each notificationSounds as sound}
                <Option value={sound.file}>{sound.name}</Option>
            {/each}
        </Select>
        {#if audioPlaying}
            {#await audioPlaying}
                <div class="icon" transition:fade>
                    <Icon path={mdiVolumeHigh} size="21"></Icon>
                </div>
            {:then _}
                &nbsp;
            {/await}
        {/if}
    </div>
</div>

<style>
    .form-item {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
    }
    .icon {
        position: relative;
        color: var(--br-grey-dark);
    }
    .icon :global(.berry-icon) {
        position: absolute;
        left: 5px;
    }
</style>