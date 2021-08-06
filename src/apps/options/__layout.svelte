<script>
    import "@kwangure/strawberry/css/standardDOM";
    import Sidebar, { Link, Section } from "@kwangure/strawberry/components/Sidebar";
    import logo from "~@static/images/browser-action.png";
    import { page } from "$app/stores";

    $: path = `#!${$page.path}`;
</script>

<div class="layout">
    <nav class="header">
        <div class="left">
			<a href="#!/" class="logo">
				<img src={logo} alt="Lisa logo"/>
			</a>
		</div>
		<div class="right">

		</div>
    </nav>
    <Sidebar>
        <Section>
            <svelte:fragment slot="title">
                Phase
            </svelte:fragment>
            <svelte:fragment slot="items">
                <Link href="#!/" {path}>
                    Focus
                </Link>
                <Link href="#!/short-break" {path}>
                    Short break
                </Link>
                <Link href="#!/long-break" {path}>
                    Long break
                </Link>
            </svelte:fragment>
        </Section>
        <Section>
            <svelte:fragment slot="title">
                Other
            </svelte:fragment>
            <svelte:fragment slot="items">
                <Link href="#!/appearance" {path}>
                    Appearance
                </Link>
            </svelte:fragment>
        </Section>
    </Sidebar>
    <main>
        <slot {path}></slot>
    </main>
</div>

<style>
    .layout {
        --nav-height: 56px;
    }
    .layout {
        display: grid;
        grid-template-columns: 240px 1fr;
        grid-template-rows: max-content 1fr;
        grid-template-areas:
            "nav nav"
            "sidebar main";
        height: 100%;
    }
    nav {
        grid-area: nav;
        border-bottom: 1px solid var(--br-border-color);
        padding: 0 var(--br-outer-gutter);
    }
    .left {
        display: flex;
        align-items: center;
		margin: auto;
    }
	.left .logo {
		display: flex;
		align-items: center;
	}
	.left .logo img {
        display: block;
        height: 50px;
		padding: var(--br-outer-gutter);
	}
	.right {
        display: none;
	}
    .layout > :global(.berry-sidebar) {
        grid-area: sidebar;
    }
    .layout > :global(.berry-sidebar-section .title) {
        font-weight: 600;
        font-size: 12.5px;
    }
    main {
        grid-area: main;
        padding: var(--br-outer-gutter);
    }
</style>
