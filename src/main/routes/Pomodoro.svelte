<script>
    import { OptionsClient } from '../../background/Services'
    import { Button } from '@deimimi/strawberry'
    import { mdiHistory, mdiSettings } from '@mdi/js'
    import Timer from '../components/Timer.svelte'
    import Clock from '../components/Clock.svelte'

    function showSettings() {
        OptionsClient.once.showPage('settings')
    }

    function showHistory() {
        OptionsClient.once.showPage('history')
    }

    function randBetween(min, max) { // min and max included 
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
</script>

<div class="main" 
    style="background-image: url('../images/newtab/{randBetween(1, 30)}.webp');">
    <div class="header">
        <div class="clock">
            <Clock/>
        </div>
    </div>
    <div class="content">
        <div class="timer">
            <Timer/>
        </div>
        <div class="actions-wrapper">
            <div class="actions">
                <Button class="settings action" icon={mdiSettings}
                    on:click={showSettings}/>
                <Button class="history action" icon={mdiHistory}
                    on:click={showHistory}/>
            </div>
        </div>
    </div>
</div>

<style>
    .main {
        display: flex;
        flex-direction: column;
        height: 100%;
        background-color: #666;
        color:#fff;
        background-size: cover;
        background-repeat: no-repeat;
        background-position-x: center;
        background-position-y: center;
        background-attachment: fixed;
        background-blend-mode: overlay;
        padding: 20px 50px;
    }
    .header,
    .content {
        display: flex;
    }
    .content {
        flex-direction: column;
        flex: auto;
    }
    .clock {
        margin-left: auto;
    }
    .timer {
        margin-left: auto;
    }
    .actions-wrapper{
        margin-top: auto;
    }
    .actions {
        margin-left: auto;
    }
    .actions :global(button.action){
        background-color: transparent;
        color: #fff;
        border: none !important;
        font-size: 30px;
        height: auto;
    }
    .actions :global(button.action .button-prefix) {
        font-size: inherit;
        height: auto;
    }
</style>