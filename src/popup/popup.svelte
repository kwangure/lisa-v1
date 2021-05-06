<script>
    import { createLisaMachine } from "~@phase_ui/state";
    import Item from "./components/item.svelte";
    import open from "../common/page/open";

    async function setupTimer(htmlNode) {
        const lisaMachine = await createLisaMachine({
            target: htmlNode,
            script: "popup",
        });
        lisaMachine.start();
    }

    function showOptions() {
        open.options();
    }
</script>

<div class="popup" >
    <div class="timer" use:setupTimer></div>
    <Item on:click={showOptions}>
        Open settings page
    </Item>
</div>

<style>
    .popup {
        min-width: 250px;
    }
    .timer {
        background-color: var(--br-white);
        border-radius: var(--br-border-radius);
        color: var(--br-text);
        padding: 10px;
    }
    .timer :global(.timer) {
        font-weight: 400;
        font-size: 18px;
        letter-spacing: 0.5px;
    }
</style>