function create_notification_sounds() {
    let sounds = [{
            name: "Tone",
            file: 'f62b45bc.mp3'
        },
        {
            name: "Digital Watch",
            file: 'be75f155.mp3'
        },
        {
            name: "Analog Clock",
            file: '0f034826.mp3'
        },
        {
            name: "Digital Alarm Clock",
            file: 'fee369b7.mp3'
        },
        {
            name: "Electronic Chime",
            file: '28d6b5be.mp3'
        },
        {
            name: "Gong 1",
            file: '8bce59b5.mp3'
        },
        {
            name: "Gong 2",
            file: '85cab25d.mp3'
        },
        {
            name: "Computer Magic",
            file: '5cf807ce.mp3'
        },
        {
            name: "Fire Pager",
            file: 'b38e515f.mp3'
        },
        {
            name: "Glass Ping",
            file: '2ed9509e.mp3'
        },
        {
            name: "Music Box",
            file: 'ebe7deb8.mp3'
        },
        {
            name: "Pin Drop",
            file: '2e13802a.mp3'
        },
        {
            name: "Robot Blip 1",
            file: 'bd50add0.mp3'
        },
        {
            name: "Robot Blip 2",
            file: '36e93c27.mp3'
        },
        {
            name: "Ship Bell",
            file: '9404f598.mp3'
        },
        {
            name: "Train Horn",
            file: '6a215611.mp3'
        },
        {
            name: "Bike Horn",
            file: '72312dd3.mp3'
        },
        {
            name: "Bell Ring",
            file: 'b10d75f2.mp3'
        },
        {
            name: "Reception Bell",
            file: '54b867f9.mp3'
        },
        {
            name: "Toaster Oven",
            file: 'a258e906.mp3'
        },
        {
            name: "Battle Horn",
            file: '88736c22.mp3'
        },
        {
            name: "Ding",
            file: '1a5066bd.mp3'
        },
        {
            name: "Dong",
            file: '5e122cee.mp3'
        },
        {
            name: "Ding Dong",
            file: '92ff2a8a.mp3'
        },
        {
            name: "Airplane",
            file: '72cb1b7f.mp3'
        }
    ];

    for (let sound of sounds) {
        sound.file = `/audio/${sound.file}`;
    }

    return sounds;
}

function create_timer_sounds() {
    let sounds = [{
            name: "Stopwatch",
            file: '4cf03078.mp3',
        },
        {
            name: "Wristwatch",
            file: '8dc834f8.mp3',
        },
        {
            name: "Clock",
            file: 'af607ff1.mp3',
        },
        {
            name: "Wall Clock",
            file: '6103cd58.mp3',
        },
        {
            name: "Desk Clock",
            file: '6a981bfc.mp3',
        },
        {
            name: "Wind-up Clock",
            file: 'bc4e3db2.mp3',
        },
        {
            name: "Antique Clock",
            file: '875326f9.mp3',
        },
        {
            name: "Small Clock",
            file: '89dafd3e.mp3'
        },
        {
            name: "Large Clock",
            file: '2122d2a4.mp3',
        },
        {
            name: "Wood Block",
            file: 'ad6eac9e.mp3',
        },
        {
            name: "Metronome",
            file: 'bced7c21.mp3',
        },
        {
            name: "Pulse",
            file: 'fe5d2a62.mp3',
        }
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
    }
}