<script>
    import { onMount } from 'svelte'
    import CountdownTimer from '../CountdownTimer'
    
    const FIVE_MINS_IN_SECONDS = 300
    let timer = new CountdownTimer(FIVE_MINS_IN_SECONDS)
    let time = {}
    
    timer.onTick(()=>{
        time = timer.format()
    })
    time = timer.format()
</script>

<div>
    <div>{time? `${time.minutes} : ${time.seconds}`: ''}</div>
    <button on:click={timer.start}></button>
</div>