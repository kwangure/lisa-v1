<script>
    import { settings_writable } from '../content/settings_store'
    import { sound_client } from '../content/client'
    import { Button, Input, Icon } from '@deimimi/strawberry'
    import { mdiVolumeHigh } from '@mdi/js'

    let settings = settings_writable();
    let notification_sounds = sound_client.get_notification_sounds();

    let stop_sound_helper = () => {};

    $: can_play_sound = (() => {
        let loaded = $settings && $settings.focus;
        let sound_selected = loaded && $settings.focus.timer_sound.file != "none";
        let valid_bpm = loaded && (($settings.focus.timer_sound.bpm == null) || 
            ($settings.focus.timer_sound.bpm > 0 && 
            $settings.focus.timer_sound.bpm <= 1000));

        return sound_selected && valid_bpm;
    })();

    async function play_timer_sound() {
        let interval = Math.floor(60 / $settings.focus.timer_sound.bpm) * 1000;
        let audio = new Audio(`..${$settings.focus.timer_sound.file}`);
        let bpm = $settings.focus.timer_sound.bpm;
        if(bpm){
            let interval_id = setInterval(async function player() {
                await audio.play()
            }, interval);
            stop_sound_helper = async () => {
                clearInterval(interval_id)
            };
        } else {
            await audio.play()
            stop_sound_helper = audio.pause;
        }  
    }

    async function play_sound(file_name) {
        let audio = new Audio(`..${file_name}`);
        await audio.play()
    }

    function stop_sound() {
        // Allows us to change the listener dynamically
        stop_sound_helper()
    }
</script>
{#if $settings && $settings.focus}
    <div class="main">
        <div class="content-wrapper">
            <div class="section">
                <div class="section-header">Focus</div>
                <div class="section-field">
                    <span> Duration </span>
                    <div class="input-wrapper">
                        <Input.Number
                            min="1"
                            max="999"
                            bind:value={$settings.focus.duration}/>
                    </div>
                    <span> { $settings.focus.duration == 1 ? "minute": "minutes" }</span>
                </div>
                <div class="section-field">
                    <span>Timer sound </span>
                    <div class="input-wrapper">
                        <select bind:value={$settings.focus.timer_sound.file}>
                            <option value="none"> None </option>
                            {#await sound_client.get_timer_sounds() then sounds}
                                {#each sounds as sound}
                                    <option value="{sound.file}">{sound.name}</option>
                                {/each}
                            {/await}
                        </select>
                    </div>
                    <span> during focus </span>
                    {#if can_play_sound}
                        <span on:mouseover={play_timer_sound} on:mouseout={stop_sound} class="preview">
                            (
                                <span class="icon"><Icon path={mdiVolumeHigh} size={18}/></span> 
                                Hover to preview
                            )
                        </span>
                    {/if}
                </div>
                <div class="section-field">
                    <span>Speed: </span>
                    <div class="input-wrapper">
                        <Input.Number
                            min="0" max="1000"
                            bind:value={$settings.focus.timer_sound.bpm}/>
                    </div>
                    <span>beats per minute</span>
                </div>
                <div class="section-field">
                    When complete
                </div>
                <div class="section-field-group">
                    <div class="section-field">
                        <Input.Checkbox 
                            bind:checked={$settings.focus.notifications.desktop}
                            label="Show desktop notificiation"/>
                    </div>
                    <div class="section-field">
                        <Input.Checkbox 
                            bind:checked={$settings.focus.notifications.tab}
                            label="Show new tab notification"/>
                    </div>
                    <div class="section-field">
                        <span>Play notification audio</span>
                        <div class="input-wrapper">
                            <select bind:value={$settings.focus.notifications.sound}
                                on:input={(e)=>play_sound(e.target.value)}>
                                <option value="none">None</option>
                                {#await notification_sounds then sounds}
                                    {#each sounds as sound}
                                    <option value={sound.file}>{ sound.name }</option>
                                    {/each}
                                {/await}
                            </select>
                        </div>
                    </div> 
                </div>
            </div>
            <div class="section">
                <div class="section-header">Short Break</div>
                <div class="section-field">
                    <span>Duration</span>
                    <div class="input-wrapper">
                        <Input.Number
                            min="1"
                            max="999"
                            bind:value={$settings.short_break.duration}/>
                    </div>
                    <span>{ $settings.short_break.duration == 1 ? "minute": "minutes" }</span>
                </div>
                <div class="section-field">When complete</div>
                <div class="section-field-group">
                    <div class="section-field">
                        <Input.Checkbox
                            bind:checked={$settings.short_break.notifications.desktop}
                            label="Show desktop notification"/>
                    </div>
                    <div class="section-field">
                        <Input.Checkbox
                            bind:checked={$settings.short_break.notifications.tab}
                            label="Show new tab notification"/>
                    </div>
                    <div class="section-field">
                        <span>Play audio notification</span>
                        <div class="input-wrapper">
                            <select bind:value={$settings.short_break.notifications.sound}
                                on:input={(e)=>play_sound(e.target.value)}>
                                <option value="none">None</option>
                                {#await notification_sounds then sounds}
                                    {#each sounds as sound}
                                    <option value={sound.file}>{ sound.name }</option>
                                    {/each}
                                {/await}
                            </select>
                        </div> 
                    </div>
                </div>
            </div>
            <div class="section">
                <div class="section-header">Long Break</div>
                <div class="section-field">
                    <span>Take a long break</span>
                    <div class="input-wrapper">
                        <select bind:value={$settings.long_break.interval}>
                            <option value="0">Never</option>
                            <option value="2">every 2nd break</option>
                            <option value="3">every 3rd break</option>
                            <option value="4">every 4th break</option>
                            <option value="5">every 5th break</option>
                            <option value="6">every 6th break</option>
                            <option value="7">every 7th break</option>
                            <option value="8">every 8th break</option>
                            <option value="9">every 9th break</option>
                            <option value="10">every 10th break</option>
                        </select>
                    </div>
                </div>
                {#if $settings.long_break.interval != 0}
                    <div class="section-field">
                        <span>Duration</span>
                        <div class="input-wrapper">
                            <Input.Number
                                min="1"
                                max="999"
                                bind:value={$settings.long_break.duration}
                                />
                        </div>
                        <span>{ $settings.long_break.duration == 1 ? "minute": "minutes" }</span>
                    </div>
                    <div class="section-field">When Complete</div>
                    <div class="section-field-group">
                        <div class="section-field">
                            <Input.Checkbox 
                                bind:checked={$settings.long_break.notifications.desktop}
                                label="Show desktop notification"/>
                        </div>
                        <div class="section-field">
                            <Input.Checkbox
                                bind:checked={$settings.long_break.notifications.tab}
                                label="Show new tab notification"/>
                        </div>
                        <div class="section-field">
                            <span>Play audio notification</span>
                            <div class="input-wrapper">
                                <select bind:value={$settings.long_break.notifications.sound}
                                    on:input={(e)=>play_sound(e.target.value)}>
                                    <option value="none">None</option>
                                    {#await notification_sounds then sounds}
                                        {#each sounds as sound}
                                            <option value={sound.file}>{ sound.name }</option>
                                        {/each}
                                    {/await}
                                </select>
                            </div>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}

<style>
    .main {
        padding: 10px 20px;
        overflow: scroll;
        color: #222;
    }
    .content-wrapper {
        margin: 0 auto;
        max-width: 700px;
    }
    .section,
    .section-field {
        display: flex;
    }
    .section {
        flex-direction: column;
        border-bottom: 1px solid #d9d9d9;
        margin-bottom: 10px;
        padding-bottom: 10px;
    }
    .section-header {
        margin: 10px 0px;
        font-size: 18px;
        font-weight: 500;
    }
    .section-field-group {
        padding-left: 30px;
    }
    .section-field {
        align-items: center;
        margin-bottom: 10px;
    }
    .input-wrapper {
        margin: 0 8px;
    }
    select {
        font-family: sans-serif;
        font-size: 13px;
        color: #444;
        height: 35px;
        padding: .6em 1.4em .5em .8em;
        max-width: 100%;
        box-sizing: border-box;
        border: 1px solid #d9d9d9;
        border-radius: 4px;
        background-color: #fff;
        background-repeat: no-repeat, repeat;
        background-position: right .7em top 50%, 0 0;
        background-size: .65em auto, 100%;
    }
    select::-ms-expand {
        display: none;
    }
    select:hover {
        border-color: #888;
    }
    select:focus {
        border-color: #aaa;
        box-shadow: 0 0 1px 3px rgba(59, 153, 252, .7);
        box-shadow: 0 0 0 3px -moz-mac-focusring;
        color: #222;
        outline: none;
    }
    select option {
        font-weight:normal;
    }
    /*.preview .icon {
        font-size: 18px;
    }*/
</style>