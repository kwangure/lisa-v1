<script>
    import { OptionsClient } from '../../background/Services'
    import Button from '../components/Button.svelte'
    import Timer from '../components/Timer.svelte'

    function showSettings() {
        OptionsClient.once.showPage('settings')
    }

    function showHistory() {
        OptionsClient.once.showPage('history')
    }
</script>

<div class="main">
    <div class="header">

    </div>
    <Timer/>
    <div>
        <Button on:click={showSettings} icon="settings-outline" class="settings"/>
        <Button on:click={showHistory}  icon="history" class="history"/>
    </div>
</div>

<style>
    .main {
        display: flex;
        flex-direction: column;
        height: 100%;
        background-color: #444;
        color:#fff;
    }
</style>