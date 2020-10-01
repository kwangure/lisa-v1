<script>
    import Button from "@deimimi/strawberry/components/Button";
    import { mdiPause, mdiPictureInPictureBottomRightOutline, mdiPlayOutline } from "@mdi/js";
    import { timer } from "../common/events";
    import { timerPositions } from "../common/store/settings";

    export let paused = false;
    export let position;
</script>

<div class="controls">
    {#if paused}
        <Button icon={mdiPlayOutline} on:click={timer.play}/>
    {:else}
        <Button icon={mdiPause} on:click={timer.pause}/>
    {/if}
    {#if position === timerPositions.BOTTOM_RIGHT}
        <Button icon={mdiPictureInPictureBottomRightOutline} iconProps={{flip: "horizontal"}}
            on:click={() => position = timerPositions.BOTTOM_LEFT}/>
    {:else}
        <Button icon={mdiPictureInPictureBottomRightOutline}
            on:click={() => position = timerPositions.BOTTOM_RIGHT}/>
    {/if}
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