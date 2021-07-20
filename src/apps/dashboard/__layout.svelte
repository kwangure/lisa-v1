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
        height: 100%;
        display: grid;
        grid-template-rows: max-content 1fr;
    }
    .layout :global(.berry-navbar) {
        --br-nav-border: var(--br-border);
    }
    img {
        display: block;
        height: 50px;
		padding: var(--br-outer-gutter);
	}
    main {
        padding: var(--br-outer-gutter);
    }
</style>
