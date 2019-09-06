<script>
    import * as Sounds from '../../Sounds';
    import { SettingsClient, SoundsClient } from '../../background/Services'
    import { Button, Input, Icon } from '@deimimi/strawberry'
    import { mdiVolumeHigh } from '@mdi/js'
    import createTimerSound from '../../TimerSound'
    import M from '../../Messages';
    import Mutex from '../../Mutex';
    import Page from '../../main/components/Page.svelte'

    function getFocusTimerBpm() {
        let sound = settings.focus.timerSound;
        return sound
            && sound.metronome
            && sound.metronome.bpm;
    }

    let settingsClient = new SettingsClient()
    let soundsClient = new SoundsClient()
    let settings = null
    let showSettingsSaved = false
    let showSettingsSavedTimeout = null
    let notificationSounds = null
    let timerSounds = null
    let timerSound = null
    let timerSoundMutex = new Mutex()
    let focusTimerSound = null
    let focusTimerBPM = null

    settingsClient.getSettings()
        .then((response)=>{
            settings = response
            focusTimerSound = getFocusTimerSound()
            focusTimerBPM = getFocusTimerBpm()
        })

    soundsClient.getNotificationSounds()
        .then((response)=>{
            notificationSounds = response
        })
    
    soundsClient.getTimerSounds()
        .then((response)=>{
            timerSounds = response
        })

    function getFocusTimerSound() {
        let sound = settings && settings.focus.timerSound;
        return sound && (sound.procedural || sound.metronome.files);
    }

    function saveSettings() {
        if(typeof settings !== 'object' || settings === null) return;
        settingsClient.setSettings(settings)
        clearTimeout(showSettingsSavedTimeout);
        showSettingsSavedTimeout = setTimeout(() => {
            showSettingsSaved = false;
        }, 1000);
        showSettingsSaved = true;
    }
    async function playTimerSound() {
        timerSoundMutex.exclusive(async () => {
            timerSound = await createTimerSound(settings.focus.timerSound);
            if(timerSound) timerSound.start();
        });
    }
    function stopTimerSound() {
        timerSoundMutex.exclusive(async () => {
            if(timerSound){
                timerSound.close()  
                timerSound = null
            }
        })
    }
    function dismissSettingsSaved() {
        showSettingsSaved = false
        clearTimeout(showSettingsSavedTimeout)
    }

    function setFocusTimerSound(value) {
        if(!settings) return
        let focus = settings.focus;
        if (!value) {
          focus.timerSound = null;
        } else if (!Array.isArray(value)) {
            focus.timerSound = {
                procedural: value
            };
        } else if (focus.timerSound && focus.timerSound.metronome) {
            focus.timerSound.metronome.files = value;
        } else {
            focus.timerSound = {
                metronome: {
                    files: value,
                    bpm: 60
                }
            }
        }
    }

    function setSound(filename) {
        if(filename !== "null"){
            Sounds.play(filename);
        }
    }

    function setFocusTimerBpm(bpm) {
        let sound = settings.focus.timerSound;
        if (!sound || !sound.metronome) {
            return;
        }
        sound.metronome.bpm = bpm;
    }

    function canPlayTimerSound() {
        let bpm = focusTimerBpm;
        return focusTimerSound
            && ((bpm == null) || (bpm > 0 && bpm <= 1000));
    }

    $: saveSettings(settings);
    $: setFocusTimerSound(focusTimerSound)
</script>

<Page>
    {#if settings}
        <div class="main">
            <div class="content-wrapper">
                <div class="section">
                    <div class="section-header">{M.focus}</div>
                    <div class="section-field">
                        <span>{ M.duration }</span>
                        <div class="input-wrapper">
                            <Input
                                type="number"
                                min="1"
                                max="999"
                                bind:value={settings.focus.duration}/>
                        </div>
                        <span> { settings.focus.duration == 1 ? M.minute: M.minutes }</span>
                    </div>
                    <div class="section-field">
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
                    </div>
                    <div class="section-field">
                        {#if focusTimerBPM != null}
                            <span>{ M.speed_label }</span>
                            <div class="input-wrapper">
                                <Input
                                    type="number"
                                    min="1" max="1000"
                                    bind:value={focusTimerBPM}/>
                            </div>
                            <span>{ M.bpm }</span>
                        {/if}
                    </div>
                    <div class="section-field">
                        { M.when_complete}
                    </div>
                    <div class="section-field-group">
                        <div class="section-field">
                            <Input 
                                type="checkbox" 
                                bind:checked={settings.focus.notifications.desktop}
                                label={M.show_desktop_notification }/>
                        </div>
                        <div class="section-field">
                            <Input 
                                type="checkbox" 
                                bind:checked={settings.focus.notifications.tab}
                                label={M.show_new_tab_notification}/>
                        </div>
                        <div class="section-field">
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
                        </div> 
                    </div>
                </div>
                <div class="section">
                    <div class="section-header">{ M.short_break }</div>
                    <div class="section-field">
                        <span>{ M.duration }</span>
                        <div class="input-wrapper">
                            <Input
                                type="number"
                                min="1"
                                max="999"
                                bind:value={settings.shortBreak.duration}/>
                        </div>
                        <span>{ settings.shortBreak.duration == 1 ? M.minute: M.minutes }</span>
                    </div>
                    <div class="section-field">{ M.when_complete }</div>
                    <div class="section-field-group">
                        <div class="section-field">
                            <Input 
                                type="checkbox" 
                                bind:checked={settings.shortBreak.notifications.desktop}
                                label={M.show_desktop_notification}/>
                        </div>
                        <div class="section-field">
                            <Input 
                                type="checkbox" 
                                bind:checked={settings.shortBreak.notifications.tab}
                                label={ M.show_new_tab_notification }/>
                        </div>
                        <div class="section-field">
                            <span>{ M.play_audio_notification }</span>
                            <div class="input-wrapper">
                                <select 
                                    bind:value={settings.shortBreak.notifications.sound} 
                                    on:input={event => setSound(event.target.value)}>
                                    <option value="null">{ M.none }</option>
                                    {#each notificationSounds as sound}
                                        <option value={sound.file}>{ sound.name }</option>
                                    {/each}
                                </select>
                            </div> 
                        </div>
                    </div>
                </div>
                <div class="section">
                    <div class="section-header">{ M.long_break }</div>
                    <div class="section-field">
                        <span>{ M.take_a_long_break_setting }</span>
                        <div class="input-wrapper">
                            <select bind:value={settings.longBreak.interval}>
                                <option value="0">{ M.never }</option>
                                <option value="2">{ M.every_2nd_break }</option>
                                <option value="3">{ M.every_3rd_break }</option>
                                <option value="4">{ M.every_4th_break }</option>
                                <option value="5">{ M.every_5th_break }</option>
                                <option value="6">{ M.every_6th_break }</option>
                                <option value="7">{ M.every_7th_break }</option>
                                <option value="8">{ M.every_8th_break }</option>
                                <option value="9">{ M.every_9th_break }</option>
                                <option value="10">{ M.every_10th_break }</option>
                            </select>
                        </div>
                    </div>
                    {#if settings.longBreak.interval != 0}
                        <div class="section-field">
                            <span>{ M.duration }</span>
                            <div class="input-wrapper">
                                <Input
                                    type="number"
                                    min="1"
                                    max="999"
                                    bind:value={settings.longBreak.duration}
                                    />
                            </div>
                            <span>{ settings.longBreak.duration == 1 ? M.minute: M.minutes }</span>
                        </div>
                        <div class="section-field">{ M.when_complete }</div>
                        <div class="section-field-group">
                            <div class="section-field">
                                <Input 
                                    type="checkbox" 
                                    bind:checked={settings.longBreak.notifications.desktop}/>
                                <span>{ M.show_desktop_notification }</span>
                            </div>
                            <div class="section-field">
                                <Input 
                                    type="checkbox" 
                                    bind:checked={settings.longBreak.notifications.tab}/>
                                <span>{ M.show_new_tab_notification }</span>
                            </div>
                            <div class="section-field">
                                <span>{ M.play_audio_notification }</span>
                                <div class="input-wrapper">
                                    <select 
                                        bind:value={settings.longBreak.notifications.sound} 
                                        on:input={event => setSound(event.target.value)}>
                                        <option value="null">{ M.none }</option>
                                        {#each notificationSounds as sound}
                                            <option value={sound.file}>{ sound.name }</option>
                                        {/each}
                                    </select>
                                </div>
                            </div>
                        </div>
                    {/if}
                </div>
                {#if showSettingsSaved}
                    <div on:click={dismissSettingsSaved} class="save">
                        <p><img src="/images/check.svg" alt="check mark"> { M.settings_saved }</p>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</Page>

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
    .preview .icon {
        font-size: 18px;
    }
</style>