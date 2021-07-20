<script>
    import { createSettingStore, timerPositions } from "~@common/settings";
    import Dropdown, { Item } from "@kwangure/strawberry/components/Dropdown";
    import {
        mdiDotsHorizontal,
        mdiPause,
        mdiPictureInPictureBottomRightOutline,
        mdiPlayOutline,
    } from "@mdi/js";
    import Button from "@kwangure/strawberry/components/Button";
    import { getContext } from "svelte";
    import { timer } from "~@common/events";

    const state = getContext("timer-state");
    const settings = createSettingStore();

    let timerState;
    $: ({ timerMachine: { state: timerState }} = $state);
    $: ({ timerPosition } = $settings.appearanceSettings);
    $: timerPositionRight = timerPosition === timerPositions.BOTTOM_RIGHT.value;

    function positionLeft() {
        $settings.appearanceSettings.timerPosition = timerPositions.BOTTOM_LEFT.value;
    }

    function positionRight() {
        $settings.appearanceSettings.timerPosition = timerPositions.BOTTOM_RIGHT.value;
    }
</script>

<div class="controls">
    {#if timerState.paused === "default" || timerState === "completed"}
        <Button icon={mdiPlayOutline} on:click={() => timer.play()}/>
    {:else}
        <Button icon={mdiPause} on:click={() => timer.pause()}/>
    {/if}
    {#if timerPositionRight}
        <Button icon={mdiPictureInPictureBottomRightOutline}
            iconProps={{ flip: { horizontal: true }}}
            on:click={positionLeft}/>
    {:else}
        <Button icon={mdiPictureInPictureBottomRightOutline}
            on:click={positionRight}/>
    {/if}
    <Dropdown placement="auto-end">
        <svelte:fragment slot="button">
            <Button icon={mdiDotsHorizontal}/>
        </svelte:fragment>
        <Item on:click={() => timer.reset()}>Reset the running timer</Item>
        <Item on:click={() => timer.restart()}>Reset focus cyle</Item>
        <Item on:click={() => timer.disable()}>Disable timer</Item>
    </Dropdown>
</div>

<style>
    .controls {
        display: flex;
        margin: 0 10px;
        justify-content: center;
    }
    .controls :global(.berry-button) {
        border: none !important;
    }
</style>