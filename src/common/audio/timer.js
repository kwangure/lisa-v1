function createTimerSound(name, file) {
    return { name: name, file: `/audio/${file}` };
}

export default [
    createTimerSound("Stopwatch", "4cf03078.mp3"),
    createTimerSound("Clock", "af607ff1.mp3"),
    createTimerSound("Wall clock", "6103cd58.mp3"),
    createTimerSound("Large clock", "2122d2a4.mp3"),
    createTimerSound("Wood block", "ad6eac9e.mp3"),
    createTimerSound("Metronome", "bced7c21.mp3"),
    createTimerSound("Pulse", "fe5d2a62.mp3"),
];
