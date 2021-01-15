<script>
    import "@kwangure/strawberry/css/standardDOM";
    import Sidebar, { Item } from "@kwangure/strawberry/components/Sidebar";
    import { getContext } from "svelte";

    const { path } = getContext("__stores__");

    function createItem(name, route) {
        return { name, route };
    }

    const items = [
        createItem("Timer", "/"),
        createItem("Appearance", "/appearance"),
    ];
</script>

<div class="app-layout">
    <div class="sidebar">
        <Sidebar>
            {#each items as {name, route}}
                {console.log({ route, $path }) || ""}
                <Item active={route === $path}>
                    <a href="#!{route}">{name}</a>
                </Item>
            {/each}
        </Sidebar>
    </div>
    <div>
        <slot {path}></slot>
    </div>
</div>

<style>
    .app-layout {
        display: flex;
        height: 100%;
        font-size: 14px;
    }
    .sidebar {
        padding: 10px 0;
        color: var(--br-grey-dark);
    }
</style>
