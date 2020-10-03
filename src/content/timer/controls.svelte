<script>
    import Button from "@deimimi/strawberry/components/Button";
    import Dropdown, { Item } from "@deimimi/strawberry/components/Dropdown";
    import { mdiDotsHorizontal, mdiPause, mdiPictureInPictureBottomRightOutline, mdiPlayOutline } from "@mdi/js";
    import { timer } from "../../common/events";

    export let paused = false;
    export let position
</script>

<div class="controls">
    {#if paused}
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
    .controls :global(.berry-button) {
        border: none !important;
    }
</style>