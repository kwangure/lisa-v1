<script>
    import Icon from './Icon.svelte'
    export let type = 'text'
    export let name = ''
    export let label = ''
    export let placeholder = ''
    export let icon = ''
    export let min = null
    export let max = null
    export let value = ''
    export let disabled = false
    export let autofocus

    // Update value manually since Svelte does not allow data  
    // binding if input type is dynamic (and for good reason)
    function updateValue(e){
        value=e.target.value
    }

</script>

<label class="input-wrapper">
    {#if label}
        <div class="label">{label.length? label : placeholder}</div>
    {/if}
    {#if icon}
        <span class="input-prefix">
            <Icon {icon}></Icon>
        </span>
    {/if}
    <input 
        {min} {max}
        on:blur on:change on:input={updateValue} on:input on:keypress on:focus
        on:keydown {type} {name} {placeholder} {value} {disabled}  autofocus 
        class="{icon? 'input-icon': ''}">
</label>

<style>
    .input-wrapper {
        line-height: 1.5;
        display: inline-block;
        width: 100%;
        position: relative;
    }
    .input-prefix {
        position: absolute;
        top: 52%;
        z-index: 2;
        color: rgba(0,0,0,0.65);
        line-height: 0;
        -webkit-transform: translateY(-50%);
        -ms-transform: translateY(-50%);
        transform: translateY(-50%);
        left: 12px;
    }
    input {
        text-align: inherit;
        display: inline-block;
        width: 100%;
        height: 35px;
        padding: 4px 11px;
        color: rgba(0,0,0,0.65);
        font-size: 14px;
        line-height: 1.5;
        background-color: #fff;
        background-image: none;
        border: 1px solid #d9d9d9;
        border-radius: 4px;
        -webkit-transition: all .3s;
        transition: all .3s;
    }
    input:hover {
        border-color: #40a9ff;
    }
    input:focus {
        border-color: #40a9ff;
        outline: 0;
        -webkit-box-shadow: 0 0 0 2px rgba(24,144,255,0.2);
        box-shadow: 0 0 0 2px rgba(24,144,255,0.2);
    }
    .input-icon {
        padding-left: 30px;
    }
    .label {
        margin-bottom: 5px;
    }
</style>