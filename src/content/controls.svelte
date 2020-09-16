<script>
    import Button from "@deimimi/strawberry/components/Button";
    import { mdiPause, mdiPictureInPictureBottomRightOutline, mdiPlay, } from "@mdi/js";
    import { timer } from "../common/events";

    export let paused = false;
</script>

<div class="controls">
    {#if paused}
        <Button icon={mdiPlay} on:click={timer.play}/>
    {:else}
        <Button icon={mdiPause} on:click={timer.pause}/>
    {/if}
    <Button icon={mdiPictureInPictureBottomRightOutline} iconProps={{flip: "horizontal"}}/>
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