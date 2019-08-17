<script>
    import { OptionsClient } from '../../background/Services'
    import Button from '../components/Button.svelte'
    import Timer from '../components/Timer.svelte'
    import Clock from '../components/Clock.svelte'

    let time

    (function showTime(){
        let date = new Date()
        let hours = date.getHours()
        let minutes = date.getMinutes()
        let session = hours > 11 ? "pm": "am"
        
        hours = hours == 0 ? 12 : hours
        hours = hours > 12 ? hours - 12: hours
        minutes = (minutes < 10) ? "0" + minutes : minutes

        time = `${hours}:${minutes} ${session}`

        setTimeout(showTime, 1000)
    })()

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
                <Button class="settings action" icon="settings-outline"
                    on:click={showSettings}/>
                <Button class="history action" icon="history" 
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