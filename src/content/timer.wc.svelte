<script>
    import { createLisaMachine } from "~@phase_ui/state";
    // eslint-disable-next-line camelcase
    import { get_current_component } from "svelte/internal";

    const thisComponent = get_current_component();
    createLisaMachine({
        target: thisComponent.shadowRoot,
        script: "content",
    })
        .then((timerMachine) => {
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