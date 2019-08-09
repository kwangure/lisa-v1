<script>
    import WindowTitle from './WindowTitle.svelte'
</script>
<div class="page">
    <slot></slot>
</div>
<style>
    .page {
        display: flex;
        flex-direction: column;
        height: 100%;
    }
</style>