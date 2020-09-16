<script>
    import { settings } from "../../common/events";

    let settingsStore = null;
    (async() => {
        settingsStore = await settings.getState();
    })();
</script>



<style>
    
</style>