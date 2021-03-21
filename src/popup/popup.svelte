<script>
    import { createLisaMachine } from "~@phase_ui/state";

    async function setupTimer(htmlNode) {
        const lisaMachine = await createLisaMachine({
            target: htmlNode,
            script: "popup",
        });
        lisaMachine.start();
    }
</script>

<div class="popup" >
    <div class="timer" use:setupTimer></div>
</div>

<style>
    .popup {
        min-width: 250px;
    }
    .timer {
        text-align: center;
        align-items: center;
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