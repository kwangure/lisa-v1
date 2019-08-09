<script>
    import * as Sounds from '../../Sounds';
    import { SettingsClient, SoundsClient } from '../../background/Services'
    import Button from '../../main/components/Button.svelte'
    //import CountdownSettings from './CountdownSettings'
    import createTimerSound from '../../TimerSound'
    import Input from '../../main/components/Input.svelte'
    import Icon from '../../main/components/Icon.svelte'
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
            timerSound.start();
        });
    }
    function stopTimerSound() {
        timerSoundMutex.exclusive(async () => {
            timerSound.close()  
            timerSound = null
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
      //$emit('input', filename);
      Sounds.play(filename);
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
            <h2>{M.focus}</h2>
            <div>
                <span>{ M.duration }</span>
                <Input 
                    type="number" 
                    bindvalue={settings.focus.duration} 
                    on:blur={()=>{}}/> 
                <span>{ M.minutes }</span>
            </div>
            <div>
                <p>{ M.timer_sound_label }</p>
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
                {#if canPlayTimerSound}
                    <span on:mouseover={playTimerSound} on:mouseout={stopTimerSound} class="preview">
                        <i class="icon-play"></i>
                        <span>{ M.hover_preview }</span>
                        <img src="/images/spinner.svg" class:active={timerSound} alt="sponner">
                    </span>
                {/if}
            </div>
            <div>
                {#if focusTimerBPM != null}
                    <p class="field">
                        <label>
                            <span>{ M.speed_label }</span>
                            <Input
                                type="number"
                                min="1" max="1000"
                                bindvalue={focusTimerBPM}/>
                            <span>{ M.bpm }</span>
                        </label>
                    </p>
                {/if}
            </div>
            <p>{ M.when_complete}</p>
            <div class="group">
                <label>
                    <input type="checkbox" bind:value={settings.focus.notifications.desktop}>
                    <span>{ M.show_desktop_notification }</span>
                </label>
                <label>
                    <input type="checkbox" bind:value={settings.focus.notifications.tab}>
                    <span>{ M.show_new_tab_notification }</span>
                </label>
                <label>
                    <span>{ M.play_audio_notification }</span>
                    <select 
                        bind:value={settings.focus.notifications.sound} 
                        on:input={event => setSound(event.target.value)}>
                        <option value="null">{ M.none }</option>
                        {#each notificationSounds as sound}
                            <option salue={sound.file}>{ sound.name }</option>
                        {/each}
                    </select>
                </label>
            </div>
        </div>
        <div class="section">
        <h2>{ M.short_break }</h2>
        <p class="field">
            <label>
            <span>{ M.duration }</span>
            <input
                type="number"
                min="1"
                max="999"
                class="duration"
                bindvalue={settings.shortBreak.duration}>
            <span>{ M.minutes }</span>
            </label>
        </p>
        <p>{ M.when_complete }</p>
        <div class="group">
            <p class="field">
            <label>
                <input type="checkbox" bindvalue={settings.shortBreak.notifications.desktop}>
                <span>{ M.show_desktop_notification }</span>
            </label>
            </p>
            <p class="field">
            <label>
                <input type="checkbox" bindvalue={settings.shortBreak.notifications.tab}>
                <span>{ M.show_new_tab_notification }</span>
            </label>
            </p>
            <p class="field">
            <label>
                <span>{ M.play_audio_notification }</span>
                <select 
                        bindvalue={settings.shortBreak.notifications.sound} 
                        on:input={event => setSound(event.target.value)}>
                        <option value="null">{ M.none }</option>
                        {#each notificationSounds as sound}
                            <option salue={sound.file}>{ sound.name }</option>
                        {/each}
                    </select>
            </label>
            </p>
        </div>
        </div>
        <div class="section">
        <h2>{ M.long_break }</h2>
        <p class="field">
            <label>
            <span>{ M.take_a_long_break_setting }</span>
            <select bindvalue={settings.longBreak.interval}>
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
            </label>
        </p>
        <fieldset :disabled="settings.longBreak.interval == 0">
            <p class="field">
            <label>
                <span>{ M.duration }</span>
                <input
                type="number"
                min="1"
                max="999"
                class="duration"
                bindvalue={settings.longBreak.duration}>
                <span>{ M.minutes }</span>
            </label>
            </p>
            <p>{ M.when_complete }</p>
            <div class="group">
            <p class="field">
                <label>
                <input type="checkbox" bindvalue={settings.longBreak.notifications.desktop}>
                <span>{ M.show_desktop_notification }</span>
                </label>
            </p>
            <p class="field">
                <label>
                <input type="checkbox" bindvalue={settings.longBreak.notifications.tab}>
                <span>{ M.show_new_tab_notification }</span>
                </label>
            </p>
            <p class="field">
                <label>
                <span>{ M.play_audio_notification }</span>
                <select 
                        bindvalue={settings.longBreak.notifications.sound} 
                        on:input={event => setSound(event.target.value)}>
                        <option value="null">{ M.none }</option>
                        {#each notificationSounds as sound}
                            <option salue={sound.file}>{ sound.name }</option>
                        {/each}
                    </select>
                </label>
            </p>
            </div>
        </fieldset>
        </div>
        <div class="section autostart">
        <h2>{ M.autostart_title }</h2>
        <p>{ M.autostart_description }</p>
        <p class="field">
            <label>
            <span>{ M.time }</span>
            <input type="time" bindvalue={settings.autostart.time} class="time" id="autostart-time">
            </label>
        </p>
        </div>
        {#if showSettingsSaved}
            <div on:click={dismissSettingsSaved} class="save">
                <p><img src="/images/check.svg" alt="check mark"> { M.settings_saved }</p>
            </div>
        {/if}
    {/if}
</Page>

<style>
    .main {
        padding: 20px;
    }
</style>