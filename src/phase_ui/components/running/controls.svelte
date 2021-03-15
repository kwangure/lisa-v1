<script>
    import Dropdown, { Item } from "@kwangure/strawberry/components/Dropdown";
    import {
        mdiDotsHorizontal,
        mdiPause,
        mdiPictureInPictureBottomRightOutline,
        mdiPlayOutline,
    } from "@mdi/js";
    import { settings, timer } from "../../../common/events";
    import Button from "@kwangure/strawberry/components/Button";

    export let position;
    export let state;
    export let hidden;

    function handleKeyDown(event) {
        if (!event.altKey) return;

        if (event.code === "ArrowRight") {
            timer.positionRight();
        }

        if (event.code === "ArrowLeft") {
            timer.positionLeft();
        }
    }
</script>

<svelte:window on:keydown={handleKeyDown}/>

<div class="controls" class:hidden>
    {#if state.paused === "default" || state === "completed"}
        <Button icon={mdiPlayOutline} on:click={() => timer.play()}/>
    {:else}
        <Button icon={mdiPause} on:click={() => timer.pause()}/>
    {/if}
    {#if timer.isRightPosition(position)}
        <Button icon={mdiPictureInPictureBottomRightOutline}
            iconProps={{ flip: { horizontal: true }}}
            on:click={() => settings.appearance.updatePositionBottomLeft()}/>
    {:else}
        <Button icon={mdiPictureInPictureBottomRightOutline}
            on:click={() => settings.appearance.updatePositionBottomRight()}/>
    {/if}
    <Dropdown placement="topRight">
        <div slot="button">
            <Button icon={mdiDotsHorizontal}/>
        </div>
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
    .controls.hidden {
        display: none;
    }
    .controls :global(.berry-button) {
        border: none !important;
    }
</style>