export function minutesToMilliseconds(mins) {
    return mins * 60 * 1000;
}

export function millisecondsToHumanReadableTime(milliseconds, options = {}) {
    let {
        minutesBuilder = (minutes) => minutes === 0 ? "" : `${minutes}`,
        secondsBuilder = (seconds) => seconds === 0 ? "" : `${seconds}`,
        timeTemplate = "$[minutes]:$[seconds]",
    } = options;
    const MILLIS_IN_SECOND = (1000);
    const MILLIS_IN_MINUTE = (60 * MILLIS_IN_SECOND);

    const minutes = Math.floor(milliseconds / MILLIS_IN_MINUTE);
    const seconds = Math.floor((milliseconds % MILLIS_IN_MINUTE)/ MILLIS_IN_SECOND);

    timeTemplate = timeTemplate.replace("$[minutes]", minutesBuilder(minutes));
    timeTemplate = timeTemplate.replace("$[seconds]", secondsBuilder(seconds));

    return timeTemplate;
}