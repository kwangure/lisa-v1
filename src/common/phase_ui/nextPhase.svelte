<script context="module">
    export function preload(context) {
        const {
            focusPhasesSinceStart,
            focusPhasesUntilLongBreak,
            nextPhase,
            completedPhase: { name: completedPhase },
        } = context;

        return {
            focusPhasesSinceStart,
            focusPhasesUntilLongBreak,
            nextPhase,
            completedPhase,
        };
    }
</script>

<script>
    import Content from "~@content/components/nextPhase.svelte";
    import { phaseNames } from "../settings";

    export let script;
    export let focusPhasesUntilLongBreak;
    export let focusPhasesSinceStart;
    export let nextPhase;
    export let completedPhase;

    $: nextPhaseName = phaseNames[nextPhase].toLowerCase();
    $: completedPhaseName = phaseNames[completedPhase].toLowerCase();
</script>

{#if script === "content"}
    <Content {completedPhaseName} {focusPhasesUntilLongBreak}
        {focusPhasesSinceStart} {nextPhaseName}/>
{:else if script === "popup"}
    Transitioning to {nextPhaseName}.
{/if}