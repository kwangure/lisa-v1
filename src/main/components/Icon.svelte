<script>
    export let icon
    export let fontSize = false
    export let spin = false
</script>

<i class="mdi mdi-{icon} {spin ? 'mdi-spin': ''}" 
    on:click on:dblclick
    style="{fontSize? `font-size: ${fontSize} px`: ''}"></i>

<style>
    i {
        display: inline-block;
        color: inherit;
        font-size: inherit;
        font-style: normal;
        line-height: inherit;
        text-align: center;
        text-transform: none;
        -webkit-font-smoothing: antialiased;
    }
</style>