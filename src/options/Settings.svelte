<script>
    import { settings_writable } from '../content/settings_store'
    import { sound_client } from '../client'
    import { Button, Input, Icon, Select, Tooltip } from '@deimimi/strawberry'
    import { mdiVolumeHigh } from '@mdi/js'

    let settings = settings_writable();
    let notification_sounds = sound_client.get_notification_sounds();

    let stop_sound_helper = () => {};

    $: can_play_sound = (() => {
        let loaded = $settings && $settings.focus;
        let sound_selected = (
            loaded && 
            $settings.focus.timer_sound.file && 
            $settings.focus.timer_sound.file != "none"
        );

        return sound_selected;
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

    function sounds_to_options(options) {
        options = options.map(({file, name, ...rest}) => (
                    { value: file, text: name, ...rest}
                ))
        options.unshift({text:"None",value:"none"})
        return options
    }

    async function play_sound(sound) {
        let can_play = sound && sound != "none";

        if(can_play) {
            let audio = new Audio(`..${sound}`);
            await audio.play()
        }
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
                        {#await sound_client.get_timer_sounds() then sounds}
                            <Select bind:value={$settings.focus.timer_sound.file} 
                                options={sounds_to_options(sounds)}/>
                        {/await}
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
                <div class="section-field" class:disabled={!can_play_sound}>
                    <Tooltip label={can_play_sound ? "": "Disabled. Set timer sound first."}>
                        <span>Speed: </span>
                        <div class="input-wrapper">
                            <Input.Number disabled={!can_play_sound}
                                min="0" max="1000"
                                bind:value={$settings.focus.timer_sound.bpm}/>
                        </div>
                        <span>beats per minute</span>
                    </Tooltip>
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
                        <span>Play audio notification</span>
                        <div class="input-wrapper">
                            {#await notification_sounds then sounds}
                                <Select bind:value={$settings.focus.notifications.sound}
                                    on:change={(e)=> play_sound(e.detail)}
                                    options={sounds_to_options(sounds)}/>
                            {/await}
                        </div>
                        <span>after completing interval</span>
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
                            {#await notification_sounds then sounds}
                                <Select bind:value={$settings.short_break.notifications.sound}
                                    on:change={(e)=>play_sound(e.detail)}
                                    options={sounds_to_options(sounds)}/>
                            {/await}
                        </div> 
                        <span>after completing interval</span>
                    </div>
                </div>
            </div>
            <div class="section">
                <div class="section-header">Long Break</div>
                <div class="section-field">
                    <span>Take a long break</span>
                    <div class="input-wrapper">
                        <Select bind:value={$settings.long_break.interval}
                            options={[
                                {value: 0, text: "Never"},
                                {value: 2, text: "every 2nd break"},
                                {value: 3, text: "every 3rd break"},
                                {value: 4, text: "every 4th break"},
                                {value: 5, text: "every 5th break"},
                                {value: 6, text: "every 6th break"},
                                {value: 7, text: "every 7th break"},
                                {value: 8, text: "every 8th break"},
                                {value: 9, text: "every 9th break"},
                                {value: 10, text: "every 10th break"},
                            ]}
                        >
                        </Select>
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
                                {#await notification_sounds then sounds}
                                <Select bind:value={$settings.long_break.notifications.sound}
                                    on:change={(e)=>play_sound(e.detail)}
                                    options={sounds_to_options(sounds)}
                                    placement="topLeft"/>
                                {/await}
                            </div>
                            <span>after completing interval</span>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}

<style>
    @import "@deimimi/strawberry/css/strawberry.css";

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
    .section-field,
    .section-field :global(.tooltip) {
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
    .section-field,
    .section-field :global(.tooltip) {
        align-items: center;
        margin-bottom: 10px;
    }
    .section-field.disabled > * {
        cursor: not-allowed;
    }
    .input-wrapper {
        margin: 0 8px;
    }
    .input-wrapper :global(input[type=number]) {
        color: inherit;
    }
</style>