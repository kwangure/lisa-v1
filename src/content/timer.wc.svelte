<script>
    import { createTimerMachine } from "./state";
    import { onMount } from "svelte";
    import { get_current_component } from "svelte/internal";

    const thisComponent = get_current_component();
    const timerMachine = createTimerMachine({ target: thisComponent.shadowRoot });

    onMount(() => {
        timerMachine.start();
    });
</script>

<svelte:options tag="lisa-timer"/>

<link rel="stylesheet" href={chrome.extension.getURL("__CONTENT_CSS__")}/>