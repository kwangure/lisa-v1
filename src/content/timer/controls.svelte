<script>
    import Button from "@kwangure/strawberry/components/Button";
    import Dropdown, { Item } from "@kwangure/strawberry/components/Dropdown";
    import {
        mdiDotsHorizontal,
        mdiPause,
        mdiPictureInPictureBottomRightOutline,
        mdiPlayOutline,
    } from "@mdi/js";
    import { timer } from "../../common/events";

    export let position;
    export let state;
    export let hidden;

    function handleKeyDown(e) {
        if (!e.altKey) return;

        if (e.code === "ArrowRight") {
            timer.positionRight();
        }

        if (e.code === "ArrowLeft") {
            timer.positionLeft();
        }
    }
</script>

<svelte:window on:keydown={handleKeyDown}/>

<div class="controls" class:hidden>
    {#if state === "paused" || state === "completed"}
        <Button icon={mdiPlayOutline} on:click={timer.play}/>
    {:else}
        <Button icon={mdiPause} on:click={timer.pause}/>
    {/if}
    {#if timer.isRightPosition(position)}
        <Button icon={mdiPictureInPictureBottomRightOutline} iconProps={{flip: {horizontal: true}}}
            on:click={() => timer.positionLeft()}/>
    {:else}
        <Button icon={mdiPictureInPictureBottomRightOutline}
            on:click={() => timer.positionRight()}/>
    {/if}
    <Dropdown placement="topRight">
        <div slot="button">
            <Button icon={mdiDotsHorizontal}/>
        </div>
        <Item on:click={timer.reset}>Reset the running timer</Item>
    </Dropdown>
</div>

<style>
    .controls {
        display: flex;
        margin: 0 10px;
    }
    .controls.hidden {
        display: none;
    }
    .controls :global(.berry-button) {
        border: none !important;
    }
</style>