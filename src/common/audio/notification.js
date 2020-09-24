function createNotificationSound(name, file) {
    return { name, file: `/audio/${file}` };
}

export default [
    createNotificationSound("Tone", "f62b45bc.mp3"),
    createNotificationSound("Digital watch", "be75f155.mp3"),
    createNotificationSound("Computer magic", "5cf807ce.mp3"),
    createNotificationSound("Glass ping", "2ed9509e.mp3"),
    createNotificationSound("Robot blip 1", "bd50add0.mp3"),
    createNotificationSound("Robot blip 2", "36e93c27.mp3"),
    createNotificationSound("Train horn", "6a215611.mp3"),
    createNotificationSound("Bell ring", "b10d75f2.mp3"),
    createNotificationSound("Battle horn", "88736c22.mp3"),
];