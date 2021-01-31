export function minutesToMilliseconds(mins) {
    return mins * 60 * 1000;
}

function formatTime({ minutes, seconds }) {
    minutes = String(minutes).padStart(2, "0");
    seconds = String(seconds).padStart(2, "0");
    return `${minutes}:${seconds}`;
}

export function millisecondsToHumanReadableTime(
    milliseconds,
    formatter = formatTime,
) {
    const MILLIS_IN_SECOND = (1000);
    const MILLIS_IN_MINUTE = (60 * MILLIS_IN_SECOND);

    const minutes = Math.floor(milliseconds / MILLIS_IN_MINUTE);
    const seconds = Math.floor((milliseconds % MILLIS_IN_MINUTE)
        / MILLIS_IN_SECOND);

    return formatter({ minutes, seconds });
}

export function millisecondsToMinutes(time) {
    return millisecondsToHumanReadableTime(time, ({ minutes, seconds }) => {
        const formattedSeconds = seconds === 0
            ? ""
            : String(seconds/60).replace(/^.*(?=\.)/u, "");
        const isOneMinute = minutes === 1 && seconds === 0;
        const postFix = isOneMinute ? "minute": "minutes";
        return `${minutes}${formattedSeconds} ${postFix}`;
    });
}
