import { formatDuration, intervalToDuration } from "date-fns";

export function minutesToMilliseconds(mins) {
    return mins * 60 * 1000;
}

export function formatMilliseconds(ms, options) {
    const { formatter, pad, ...restOptions } = options;
    if (formatter) {
        const tokenStrings = Object.assign({
            xYears: "years",
            xMonths: "months",
            xWeeks: "weeks",
            xDays: "days",
            xHours: "hours",
            xMinutes: "minutes",
            xSeconds: "seconds",
        }, formatter);

        Object.assign(restOptions, {
            locale: {
                formatDistance: (token, count) => {
                    if (pad) count = String(count).padStart(2, "0");
                    return `${count}${tokenStrings[token]}`;
                },
            },
        });
    }
    const duration = intervalToDuration({ start: 0, end: ms });

    return formatDuration(duration, restOptions);
}
