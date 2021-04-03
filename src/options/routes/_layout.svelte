<script>
    import "@kwangure/strawberry/css/standardDOM";
    import Sidebar, { Item } from "@kwangure/strawberry/components/Sidebar";
    import { stores } from "@kwangure/svelte-pagejs-router";

    const { path } = stores();
</script>

<div class="app-layout">
    <div class="sidebar">
        <Sidebar>
            <Item active={$path === "/" || $path === "/settings/focus"}>
                <a href="#!/settings/focus">Focus</a>
            </Item>
            <Item active={$path === "/settings/short-break"}>
                <a href="#!/settings/short-break">Short break</a>
            </Item>
            <Item active={$path === "/settings/long-break"}>
                <a href="#!/settings/long-break">Long break</a>
            </Item>
            <Item active={$path === "/appearance"}>
                <a href="#!/settings/appearance">Appearance</a>
            </Item>
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
