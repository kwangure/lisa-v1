<script>
    import Layout from "./_layout.svelte";
    import { setContext } from "svelte";
    import { writable } from "svelte/store";

    export let component;

    export let error = false;
    export let status = 200;

    export let path;
    export let params;
    export let query;
    export let preload = null;

    const pathStore = writable(path);
    const paramsStore = writable(params);
    const queryStore = writable(query);

    /* eslint-disable no-unused-vars */
    $: $pathStore = path;
    $: $paramsStore = params;
    $: $queryStore = query;
    /* eslint-enable no-unused-vars */

    setContext("__stores__", {
        path: pathStore,
        params: paramsStore,
        query: queryStore,
    });
</script>

<Layout on:navigate>
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