export function minutesToMilliseconds(mins) {
    return mins * 60 * 1000;
}

export function millisecondsToHumanReadableTime(milliseconds) {
    const MILLIS_IN_SECOND = (1000);
    const MILLIS_IN_MINUTE = (60 * MILLIS_IN_SECOND);
    const minutes = String(Math.floor(milliseconds / MILLIS_IN_MINUTE)).padStart(2, "0");
    const seconds = String(Math.floor(milliseconds % MILLIS_IN_MINUTE)/ MILLIS_IN_SECOND).padStart(2, "0");
    return `${minutes}:${seconds}`;
}