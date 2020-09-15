<script>
    import Button from "@deimimi/strawberry/components/Button";
    import { mdiPause, mdiPictureInPictureBottomRightOutline } from "@mdi/js";
    import { emit } from "../common/events/emit.js";

    function pause() {
        emit({ event: "PAUSE", namespace: "TIMER" });
    }
</script>

<div class="controls">
    <Button icon={mdiPause} on:click={pause}/>
    <Button icon={mdiPictureInPictureBottomRightOutline} iconProps={{flip: "horizontal"}} color="none"/>
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