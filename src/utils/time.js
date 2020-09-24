export function minutesToMilliseconds(mins) {
    return mins * 60 * 1000;
}

function formatTime({ minutes, seconds }) {
    seconds = String(seconds).padStart(2, "0");
    return `${minutes}:${seconds}`;
}

export function millisecondsToHumanReadableTime(milliseconds, formatter = formatTime) {
    const MILLIS_IN_SECOND = (1000);
    const MILLIS_IN_MINUTE = (60 * MILLIS_IN_SECOND);

    const minutes = Math.floor(milliseconds / MILLIS_IN_MINUTE);
    const seconds = Math.floor((milliseconds % MILLIS_IN_MINUTE)/ MILLIS_IN_SECOND);

    return formatter({ minutes, seconds });
}