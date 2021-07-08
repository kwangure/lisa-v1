<script context="module">
    import setup from "../setup.js";

    export async function preload() {
        const [settings, history] = await setup;

        return { settings, history };
    }
</script>

<script>
    export let settings;
    export let history;

    $: console.log({ settings, history });
</script>

<h1> This is your Lisa dashboard </h1>