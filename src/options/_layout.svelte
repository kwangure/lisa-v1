<script>
    export let path = "";
</script>

<div class="app-layout">
    <slot {path}></slot>
</div>

<style>
    .app-layout {
        display: flex;
        flex-direction: column;
        flex: auto;
        min-height: 100%;
        font-size: 14px;
    }
</style>
