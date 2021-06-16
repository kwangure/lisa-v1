<script>
    import { derived, writable } from "svelte/store";
    import Select, { Option } from "@kwangure/strawberry/components/Select";
    import { fade } from "svelte/transition";
    import Icon from "@kwangure/strawberry/components/Icon";
    import { mdiVolumeHigh } from "@mdi/js";
    import { notificationSounds } from "../../../../common/audio";
    import { Number } from "@kwangure/strawberry/components/Input";

    export let name;
    /**
     * @type {{
     *    duration: number,
     *    warnRemaining:number,
     *    pauseDuration:number,
     *    notification: {sound:string}
     * }}
    */
    export let value;

    const ONE_MINUTE = 60000;
    const toMinute = (millis) => millis / ONE_MINUTE;
    const toMillis = (mins) => Math.ceil(mins * ONE_MINUTE);

    let durationMins, warnRemainingMins, pauseDurationMins;

    $: ({ duration, warnRemaining, pauseDuration, notification: { sound }} = value);

    $: convertToMinutes(duration, warnRemaining, pauseDuration);
    $: updateValue(durationMins, warnRemainingMins, pauseDurationMins, sound);

    function convertToMinutes(duration, warnRemaining, pauseDuration) {
        durationMins = toMinute(duration);
        warnRemainingMins = toMinute(warnRemaining);
        pauseDurationMins = toMinute(pauseDuration);
    }

    // eslint-disable-next-line max-params
    function updateValue(durationMins, warnRemaining, pauseDuration, sound) {
        value = {
            ...value,
            duration: toMillis(durationMins),
            warnRemaining: toMillis(warnRemaining),
            pauseDuration: toMillis(pauseDuration),
        };
        value.notification = {
            ...value.notification,
            sound: sound,
        };
    }

    const soundStore = writable(sound);
    $: soundStore.set(sound);
    $: audioPlaying = derived(soundStore, ($sound, setAudioPlaying) => {
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
        <Number bind:value={durationMins}
            min={import.meta.env.DEV ? 0.05 : 0.25}>
            <span slot="label">Phase duration (minutes)</span>
        </Number>
    </div>
    <div class="form-item">
        <Select bind:value={sound}>
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
        <Number bind:value={warnRemainingMins} min={0} max={durationMins}>
            <span slot="label">Warn before end (minutes)</span>
        </Number>
    </div>
    <div class="form-item">
        <Number bind:value={pauseDurationMins} min={1}>
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