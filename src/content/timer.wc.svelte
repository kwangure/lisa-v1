<script>
    import { createTimerMachine } from "./state";
    // eslint-disable-next-line camelcase
    import { get_current_component } from "svelte/internal";
    import { onMount } from "svelte";

    const thisComponent = get_current_component();
    const timerMachine = createTimerMachine({ target: thisComponent.shadowRoot });

    onMount(() => {
        timerMachine.start();
    });
</script>

<svelte:options tag="lisa-timer"/>

<link rel="stylesheet" href={chrome.extension.getURL("__CONTENT_CSS__")}/>

<style>
    @media print {
        :host {
            display: none;
        }
    }
</style>