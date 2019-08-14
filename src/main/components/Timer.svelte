<script>
    import { TimerState } from '../../background/Timer';
    import { mmss } from '../../Filters';
    import { onMount } from 'svelte'
    import M from '../../Messages';
    import Icon from '../components/Icon.svelte'
    import Button from '../components/Button.svelte'
    
    let timer 

    function fromRad(cx, cy, r, rad) {
        let x = cx + r * Math.cos(rad);
        let y = cy + r * Math.sin(rad);
        return [x, y];
    }

    function arc(rad) {
        rad = Math.max(2 * Math.PI - rad, 0.01);
        let [x, y] = fromRad(55, 55, 50, rad - Math.PI / 2);
        let largeArc = rad > Math.PI ? 0 : 1;
        let path = `M 55 5 A 50 50 0 ${largeArc} 0 ${x} ${y}`;
        if (rad <= 0.01) {
            // Draw closed path.
            path += ' Z';
        }
        return path;
    }

    export let restart = ()=>{}
    export let pause = ()=>{}
    export let resume = ()=>{}
    export let state
    export let enabled
    export let elapsed
    export let duration
    let className
    export { className as class}
  
    let  timeStyle = {}

    onMount(()=> {
        (new ResizeObserver(elements => {
        let { width, height } = elements[0].contentRect;
        let size = Math.floor(Math.min(width, height) * 0.25);
        let offset = Math.ceil(size * 0.16);
        timeStyle = {
            marginTop: `-${offset}px`,
            fontSize: `${size}px`
        };
        })).observe(timer);
    })

    $: time = (()=> {
        if (!enabled) {
            return '––:––';
        }
        let remaining = Math.max(0, Math.ceil(duration - elapsed));
        return mmss(remaining);
    })()

    $: isRunning = state == TimerState.Running;
    $: isPaused = state == TimerState.Paused;
</script>

<div class="timer {className}" bind:this={timer}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 110">
        <path class="duration" d={arc(2 * Math.PI)}/>
        {#if enabled}
            <path class="elapsed" d={arc(2 * Math.PI * (elapsed / duration))}/>
        {/if}
    </svg>
    <div class="overlay">
        <div class="controls">
            {#if isPaused}
                <Button on:click={restart} icon="restart">
                    {M.restart_timer}
                </Button>
            {:else}
                <Button class="placeholder">Placeholder</Button>
            {/if}  
        </div>
        <div class="time" class:enabled class:paused={isPaused}>
            { time }
        </div>
        <div class="controls">
            {#if isRunning}
                <Button on:click={pause} icon="pause">
                    {M.pause_timer}
                </Button>
            {:else if isPaused}
                <Button on:click={resume} icon="play">
                    {M.resume_timer}
                </Button>
            {:else}
                <Button class="placeholder">Placeholder</Button>
            {/if}
        </div>
    </div>
</div>

<style>
    @keyframes blink  {
        0% {
            opacity: 1;
        }
        49% {
            opacity: 1;
        }
        50% {
            opacity: 0;
        }
        100% {
            opacity: 0;
        }
    }
    .timer {
        height: 100%;
        width: 100%;
        position: relative;
    }
    .timer svg {
        width: 100%;
        height: 100%;
    }
    .timer svg path.duration {
        stroke: #aaa;
        stroke-width: 3px;
        fill: none;
    }
    .timer svg path.elapsed {
        stroke-width: 3px;
        stroke-linecap: round;
        fill: none;
    }
    .overlay {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        right: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }
    .overlay .time {
      font-weight: 500;
      color: rgba(255, 255, 255, 0.65);
      font-size: 30px;
    }
    .enabled {
        color: #333;
    }
    .paused {
        animation: blink 1s linear infinite;
    }

    .controls {
        z-index: 2;
        margin: 3vmin 0;
    }
    
    .controls svg {
        width: 7vmin;
        height: 7vmin;
    }
    :global(.placeholder){
        visibility: hidden;
    }
</style>