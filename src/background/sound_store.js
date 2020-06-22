function create_notification_sounds() {
    let sounds = [{
        name: "Tone",
        file: "f62b45bc.mp3",
    },
    {
        name: "Digital Watch",
        file: "be75f155.mp3",
    },
    {
        name: "Computer Magic",
        file: "5cf807ce.mp3",
    },
    {
        name: "Glass Ping",
        file: "2ed9509e.mp3",
    },
    {
        name: "Robot Blip 1",
        file: "bd50add0.mp3",
    },
    {
        name: "Robot Blip 2",
        file: "36e93c27.mp3",
    },
    {
        name: "Train Horn",
        file: "6a215611.mp3",
    },
    {
        name: "Bell Ring",
        file: "b10d75f2.mp3",
    },
    {
        name: "Battle Horn",
        file: "88736c22.mp3",
    },
    ];

    for (let sound of sounds) {
        sound.file = `/audio/${sound.file}`;
    }

    return sounds;
}

function create_timer_sounds() {
    let sounds = [{
        name: "Stopwatch",
        file: "4cf03078.mp3",
    },
    {
        name: "Clock",
        file: "af607ff1.mp3",
    },
    {
        name: "Wall Clock",
        file: "6103cd58.mp3",
    },
    {
        name: "Large Clock",
        file: "2122d2a4.mp3",
    },
    {
        name: "Wood Block",
        file: "ad6eac9e.mp3",
    },
    {
        name: "Metronome",
        file: "bced7c21.mp3",
    },
    {
        name: "Pulse",
        file: "fe5d2a62.mp3",
    },
    ];

    for (let sound of sounds) {
        sound.file = `/audio/${sound.file}`;
    }

    return sounds;
}

export function sound_store() {
    return {
        get_notification_sounds: create_notification_sounds,
        get_timer_sounds: create_timer_sounds,
    };
}