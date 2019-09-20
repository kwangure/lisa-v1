<script>
    import { pomodoroService } from './TimerMachine.js'

    let context = null     

    pomodoroService.onTransition(state => {
        if (state.changed) {
            context = state
        }
    });

    pomodoroService.start()

    function start(){
        pomodoroService.send('START')
    }

    function advance(){
        pomodoroService.send('NEXT_PHASE')
    }
</script>

<div>
    <button on:click={start}>
        ACTIVATE
    </button>
    <button on:click={advance}>
        NEXT_PHASE
    </button>

</div>

<style>
    /* your styles go here */
</style>