<script>
    import { derived, writable } from "svelte/store";
    import Select, { Option } from "@kwangure/strawberry/components/Select";
    import { fade } from "svelte/transition";
    import Icon from "@kwangure/strawberry/components/Icon";
    import { mdiVolumeHigh } from "@mdi/js";
    import { notificationSounds } from "../../../../common/audio";
    import { Number } from "@kwangure/strawberry/components/Input";

    export let name;
    export let value;

    const ONE_MINUTE = 60000;

    const duration = writable(value.duration / ONE_MINUTE);
    $: value.duration = $duration * ONE_MINUTE;

    const sound = writable(value.notification.sound);
    $: value.notification.sound = $sound;

    const warnRemaining = writable(value.warnRemaining / ONE_MINUTE);
    $: value.warnRemaining = $warnRemaining * ONE_MINUTE;

    const pauseDuration = writable(value.pauseDuration / ONE_MINUTE);
    $: value.pauseDuration = $pauseDuration * ONE_MINUTE;

    const audioPlaying = derived(sound, ($sound, setAudioPlaying) => {
        const emptyOrUnchanged = !$sound || $sound === value.notification.sound;
        if (emptyOrUnchanged) {
            return setAudioPlaying(false);
        }

        const audio = new Audio($sound);
        audio.onended = () => setAudioPlaying(false);
        audio.play().then(() => {
            setAudioPlaying(true);
        });
    });
</script>

<div class="phase">
    <h3>{name}</h3>
    <div class="form-item">
        <Number bind:value={$duration}
            min={import.meta.env.DEV ? 0.05 : 0.25}>
            <span slot="label">Phase duration (minutes)</span>
        </Number>
    </div>
    <div class="form-item">
        <Select bind:value={$sound}>
            <span slot="label">Phase completed notification tone</span>
            <Option value={null}>No sound</Option>
            {#each notificationSounds as sound}
                <Option value={sound.file}>{sound.name}</Option>
            {/each}
        </Select>
        {#if $audioPlaying}
            <div class="icon" transition:fade>
                <Icon path={mdiVolumeHigh} size="21"></Icon>
            </div>
        {/if}
    </div>
    <div class="form-item">
        <Number bind:value={$warnRemaining} min={0} max={$duration}>
            <span slot="label">Warn before end (minutes)</span>
        </Number>
    </div>
    <div class="form-item">
        <Number bind:value={$pauseDuration} min={1}>
            <span slot="label">Allowed pause duration (minutes)</span>
        </Number>
    </div>
    <slot></slot>
</div>

<style>
    .phase {
        margin-bottom: 10px;
    }
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