<script>
    const forward = () => {};
</script>

<div class="popup-item" use:forward>
    <slot></slot>
</div>

<style>
    .popup-item {
        cursor: pointer;
        background-color: transparent;
        display: flex;
        align-items: center;
        min-height: var(--br-item-height);
        line-height: 24px;
        padding: var(--br-item-vertical-padding) var(--br-item-horizontal-padding);
    }
    .popup-item:hover,
    .popup-item > :global(a:focus) {
        background-color: var(--br-primary-light);
        color: var(--br-primary);
    }
    .popup-item + :global(.popup-item) {
        margin-top: 3px;
    }
</style>