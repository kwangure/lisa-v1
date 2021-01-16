<script>
    import { mdiVolumeHigh } from "@mdi/js";
    import { notificationSounds } from "../../../common/audio";
    import { Number } from "@kwangure/strawberry/components/Input";
    import { fade } from "svelte/transition";
    import Select, { Option } from "@kwangure/strawberry/components/Select";
    import Icon from "@kwangure/strawberry/components/Icon";
    import { derived, writable } from "svelte/store";

    export let name;
    export let value;

    const ONE_MINUTE = 60000;

    $: duration = writable(value.duration / ONE_MINUTE);
    $: interval = writable(value.interval ?? false);
    $: sound = writable(value.notification.sound);

    $: setValue($duration * ONE_MINUTE, $interval, $sound);

    function setValue(duration, interval, sound) {
        value = { duration, interval, notification: { sound } };
    }

    const audioPlaying = derived(sound, ($sound, setAudioPlaying) => {
        if (!$sound) return false;

        const audio = new Audio($sound);
        audio.onended = () => setAudioPlaying(false);
        audio.play();

        return true;
    });
</script>

<div class="phase">
    <h3>{name}</h3>
    {#if $interval}
        <div class="form-item">
            Take a long break every
            <Number bind:value={$interval} min={0} max={10} hideLabel readonly>
                <span slot="label">Take a long break every</span>
            </Number>
            focus sessions
        </div>
    {/if}
    <div class="form-item">
        {name} for
        <Number bind:value={$duration} hideLabel min={0.25}>
            <span slot="label">{name} phase duration</span>
        </Number>
        minutes
    </div>
    <div class="form-item">
        Play
        <Select bind:value={$sound} hideLabel>
            <span slot="label">Notification tone after {name} phase</span>
            <Option value={null}>No sound</Option>
            {#each notificationSounds as sound}
                <Option value={sound.file}>{sound.name}</Option>
            {/each}
        </Select>
        after {name} phase
        {#if $audioPlaying}
            <div class="icon" transition:fade>
                <Icon path={mdiVolumeHigh} size="21"></Icon>
            </div>
        {/if}
    </div>
</div>

<style>
    .form-item {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
    }
    .form-item :global(.berry-input-number) {
        width: auto;
        margin-left: 1ch;
        margin-right: 1ch;
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