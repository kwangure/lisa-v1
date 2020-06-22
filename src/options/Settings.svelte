<script>
    import { settings_writable } from "../content/settings_store";
    import { sound_client } from "../client";
    import { Input, Select } from "@deimimi/strawberry";

    let settings = settings_writable();
    let notification_sounds = sound_client.get_notification_sounds();

    $: can_play_sound = (() => {
        let loaded = $settings && $settings.focus;
        let sound_selected = (
            loaded &&
            $settings.focus.timer_sound.file &&
            $settings.focus.timer_sound.file != "none"
        );

        return sound_selected;
    })();

    function sounds_to_options(options) {
        options = options.map(({file, name, ...rest}) => (
            { value: file, text: name, ...rest}
        ));
        options.unshift({text:"None",value:"none"});
        return options;
    }

    async function play_sound(sound) {
        let can_play = sound && sound != "none";

        if(can_play) {
            let audio = new Audio(`..${sound}`);
            await audio.play();
        }
    }

    $: set_input_seconds = (interval) => {
        return function handleOnchange(event) {
            $settings[interval].duration = event.target.value * 60;
        };
    };
    
    $: get_input_minutes = (interval) => {
        let seconds = $settings[interval].duration / 60;
        return seconds;
    };
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
                            min="0.1"
                            max="999"
                            value={get_input_minutes("focus")}
                            on:change={set_input_seconds("focus")}/>
                    </div>
                    <span> { $settings.focus.duration == 1 ? "minute": "minutes" }</span>
                </div>
                <div class="section-field">
                    When complete:
                </div>
                <div class="section-field-group">
                    <div class="section-field">
                        <Input.Checkbox 
                            bind:checked={$settings.focus.notifications.desktop}
                            label="Show desktop notificiation"/>
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
                    </div> 
                </div>
            </div>
            <div class="section">
                <div class="section-header">Short Break</div>
                <div class="section-field">
                    <span>Duration</span>
                    <div class="input-wrapper">
                        <Input.Number
                            min="0.1"
                            max="999"
                            value={get_input_minutes("short_break")}
                            on:change={set_input_seconds("short_break")}/>
                    </div>
                    <span>{ $settings.short_break.duration == 1 ? "minute": "minutes" }</span>
                </div>
                <div class="section-field">When complete:</div>
                <div class="section-field-group">
                    <div class="section-field">
                        <Input.Checkbox
                            bind:checked={$settings.short_break.notifications.desktop}
                            label="Show desktop notification"/>
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
                                min="0.1"
                                max="999"
                                value={get_input_minutes("long_break")}
                                on:change={set_input_seconds("long_break")}/>
                        </div>
                        <span>{ $settings.long_break.duration === 60 ? "minute": "minutes" }</span>
                    </div>
                    <div class="section-field">When complete:</div>
                    <div class="section-field-group">
                        <div class="section-field">
                            <Input.Checkbox 
                                bind:checked={$settings.long_break.notifications.desktop}
                                label="Show desktop notification"/>
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
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}

<style>
    @import "@deimimi/strawberry/src/css/shared.css";

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

