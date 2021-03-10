<script context="module">
    import createSettingStore from "./settings";
    export async function preload() {
        return {
            settingStore: await createSettingStore(),
        };
    }
</script>

<script>
    import Phase from "./_components/phase.svelte";

    export let settingStore;
</script>

<Phase name="Focus" bind:value={$settingStore.phaseSettings.focus}/>