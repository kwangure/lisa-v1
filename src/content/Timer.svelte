<script>
    import { writable } from "svelte/store";

    let pomodoro = writable({});

    async function respond(message, sender, sendResponse) {
        pomodoro.set(message)
        sendResponse({});
        return true;
    }

    onMount(() => {
        chrome.runtime.onMessage.addListener(respond);
    })

    onDestroy(() => {
        chrome.runtime.onMessage.removeListener(respond);
    })

    function start() {

    }

    function stop() {
        
    }

    function pause() {
        
    }

    function resume() {
        
    }

    function restart_timer() {
        
    }

    function restart_cycle() {
        
    }
</script>