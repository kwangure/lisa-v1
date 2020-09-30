<script>
    import { setContext } from "svelte";
    import Layout from "./_layout.svelte";

    export let error = false;
    export let status = 200;

    export let path;
    export let params;
    export let query;
    export let preload = {};

    export let component;

    setContext("stores", { path, params, query });
</script>

<Layout {path}>
    {#if error}
        {#await import("./_error.svelte") then errorPage}
            <svelte:component this={errorPage.default} {error} {status}/>
        {:catch fetchError}
            <h1>Error displaying {status}</h1>
        {/await}
	{:else}
		<svelte:component this={component} {...preload}/>
	{/if}
</Layout>