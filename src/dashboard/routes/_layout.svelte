<script>
    import "@kwangure/strawberry/css/standardDOM";
    import logo from "~@static/images/browser-action.png";
    import Navbar from "@kwangure/strawberry/components/Navbar";
</script>

<div class="layout">
    <Navbar href="#!/">
        <svelte:fragment slot="logo">
            <img src={logo} alt="Lisa's logo"/>
        </svelte:fragment>
    </Navbar>
    <main>
        <slot></slot>
    </main>
</div>

<style>
    .layout {
        display: grid;
        grid-template-columns: 240px 1fr;
        grid-template-rows: max-content 1fr;
        grid-template-areas:
            "nav nav"
            "sidebar main";
        height: 100%;
    }
    .layout > :global(.berry-sidebar) {
        grid-area: sidebar;
    }
    .layout > :global(.berry-sidebar-section .title) {
        font-weight: 600;
        font-size: 12.5px;
    }
    img {
        display: block;
        height: 50px;
		padding: var(--br-outer-gutter);
	}
    main {
        grid-area: main;
        padding: var(--br-outer-gutter);
    }
</style>
