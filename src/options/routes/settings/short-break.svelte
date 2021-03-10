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

<Phase name="Short break" bind:value={$settingStore.phaseSettings.shortBreak}/>