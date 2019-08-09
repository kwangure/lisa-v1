<script>
    import * as fh from '../fileHandler'
    import TextEditor from './TextEditor.svelte'
    import { blockDataToText, wordsInText } from '../textHandler'

    export let file = {}
    export let wordCount = 0
    export let totalWords = 0
    export let totalMillis = 0
    export let speedWPM = 0
    let content = {}
    
    let typingTimer
    var startTime
    var fullText = '';

    function calcWPM(event) {
        if(event.key.length != 1) return;
        if(!startTime) startTime = new Date();

        fullText += event.key;
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => {
            totalMillis += (new Date()) - startTime;
            totalWords = fullText.trim().split(" ").length
            startTime = null
        }, 600);
    }
    
    $: wordCount = wordsInText(blockDataToText(content))

    $: {
        if(totalWords > 2 && totalMillis > 1000) {
            speedWPM = Math.round(totalWords/(totalMillis/60000))
        }
    }

    function onsave(filepath){
        return (data)=>{
            content = data;
            fh.updateFile(filepath, JSON.stringify(data))
                .then(()=>{})
        }
    }
</script>

<div class="workbench">
    <div class="text-editor" on:keyup={calcWPM}>
        {#await fh.readFile(file.path)}
            Loading file...
        {:then response}
            <TextEditor 
                height="900" 
                content={response.length > 0? JSON.parse(response): {}}
                onsave={onsave(file.path)}/>
        {:catch error}
            <div>Error Loading File: {error}</div>
        {/await}
    </div>
</div>

<style>
    .workbench {
        overflow: auto;
        padding: 0px 20px 10px;
    }
    .text-editor {
		width: 70%;
        max-width: 800px;
        min-width: 500px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.15);
		margin: 10px auto;
        padding: 30px 40px;
        font-size: 12px;
	}
    .text-editor :global(.ce-block--focused) {
        background-color:#f9f9f9;
    }
</style>