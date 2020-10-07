<script>
    import Button from "@deimimi/strawberry/components/Button";
    import Dropdown, { Item } from "@deimimi/strawberry/components/Dropdown";
    import {
        mdiDotsHorizontal,
        mdiPause,
        mdiPictureInPictureBottomRightOutline,
        mdiPlayOutline,
        mdiBellOutline,
    } from "@mdi/js";
    import { onDestroy, onMount } from "svelte";
    import { timer } from "../../common/events";

    export let position;
    export let state;
    export let phase;
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

    onMount(() => {
        addEventListener("keydown", handleKeyDown);
    });
    onDestroy(() => {
        removeEventListener("keydown", handleKeyDown);
    });
</script>

<div class="controls" class:hidden>
    <div class="default-controls">
        {#if state === "paused" || state === "completed" || state === "reminding"}
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
    {#if state === "reminding"}
        <Dropdown placement="topRight">
            <div slot="button" class="reminding">
                <div class="badge"></div>
                <Button icon={mdiBellOutline}/>
            </div>
            <div class="reminding card">
                <div class="card-item">
                You have been paused for more than 3 minutes.
                </div>
                <div class="card-item">
                    <Button primary fullwidth on:click={timer.play}>
                        Resume {phase}
                    </Button>
                </div>
                <div class="card-item">
                    <Button fullwidth on:click={timer.pause}>Stay paused</Button>
                </div>
            </div>
        </Dropdown>
    {/if}
</div>

<style>
    .controls,
    .default-controls {
        display: flex;
    }
    .controls {
        margin: 0 10px;
    }
    .controls.hidden {
        display: none;
    }
    .default-controls :global(.berry-button),
    [slot=button] :global(.berry-button) {
        border: none !important;
    }
    [slot=button].reminding {
        position: relative;
        animation: 1.5s cubic-bezier(0.7,0,0.3,1) infinite bounce;
    }
    @keyframes bounce {
        0% { transform: translateY(0) }
        50% { transform: translateY(-60px) }
        100% { transform: translateY(0) }
    }
    .controls:hover [slot=button].reminding {
        animation: none;
    }
    .badge {
        position: absolute;
        top: 0;
        z-index: 1;
        right: 0;
        border-radius: 50%;
        padding: 4px;
        background-color: var(--br-red);
        color: var(--br-white);
        transform: translate(-25%, 25%);
    }
    .card {
        width: 250px;
        padding: 10px 20px 20px;
        line-height: 2;
    }
    .card-item:not(:last-child) {
        margin-bottom: 10px;
    }
</style>