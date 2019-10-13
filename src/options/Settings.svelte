<script>
    import { settings_writable } from '../content/settings_store'
    import { Button, Input, Icon } from '@deimimi/strawberry'
    import { mdiVolumeHigh } from '@mdi/js'

    let settings = settings_writable();
</script>
{#if $settings.focus}
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
                <!--div class="section-field">
                    <span>{ M.timer_sound_label }</span>
                    <div class="input-wrapper">
                        <select bind:value={focusTimerSound}>
                            <option value="null">{ M.none }</option>
                            <optgroup label="{M.periodic_beat}">
                                {#each timerSounds as sound}
                                    <option value="{sound.files}">{sound.name }</option>
                                {/each}
                            </optgroup>
                            <optgroup label="{M.noise}">
                            <option value="'brown-noise'">{ M.brown_noise }</option>
                            <option value="'pink-noise'">{ M.pink_noise }</option>
                            <option value="'white-noise'">{ M.white_noise }</option>
                            </optgroup>
                        </select>
                    </div>
                    <span>{ M.during_focus_label }&nbsp;</span>
                    {#if canPlayTimerSound}
                        <span on:mouseover={playTimerSound} on:mouseout={stopTimerSound} class="preview">
                            (
                                <span class="icon"><Icon path={mdiVolumeHigh} size={18}/></span> 
                                { M.hover_preview }
                            )
                        </span>
                    {/if}
                </div-->
                <!--div class="section-field">
                    {#if focusTimerBPM != null}
                        <span>{ M.speed_label }</span>
                        <div class="input-wrapper">
                            <Input.Number
                                min="1" max="1000"
                                bind:value={focusTimerBPM}/>
                        </div>
                        <span>{ M.bpm }</span>
                    {/if}
                </div-->
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
                    <!--div class="section-field">
                        <span>{ M.play_audio_notification }</span>
                        <div class="input-wrapper">
                            <select 
                                bind:value={settings.focus.notifications.sound} 
                                on:input={event => setSound(event.target.value)}>
                                <option value="null">{ M.none }</option>
                                {#each notificationSounds as sound}
                                    <option value={sound.file}>{ sound.name }</option>
                                {/each}
                            </select>
                        </div>
                    </div--> 
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
                    <!--div class="section-field">
                        <span>{ M.play_audio_notification }</span>
                        <div class="input-wrapper">
                            <select 
                                bind:value={settings.short_break.notifications.sound} 
                                on:input={event => setSound(event.target.value)}>
                                <option value="null">{ M.none }</option>
                                {#each notificationSounds as sound}
                                    <option value={sound.file}>{ sound.name }</option>
                                {/each}
                            </select>
                        </div> 
                    </div-->
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
                        <!--div class="section-field">
                            <span>{ M.play_audio_notification }</span>
                            <div class="input-wrapper">
                                <select 
                                    bind:value={$settings.long_break.notifications.sound} 
                                    on:input={event => setSound(event.target.value)}>
                                    <option value="null">{ M.none }</option>
                                    {#each notificationSounds as sound}
                                        <option value={sound.file}>{ sound.name }</option>
                                    {/each}
                                </select>
                            </div>
                        </div-->
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