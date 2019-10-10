export function mmss(seconds) {
    let minutes = Math.floor(seconds / 60);
    if (minutes < 10) {
        minutes = '0' + minutes;
    }
    seconds = Math.floor(seconds % 60);
    if (seconds < 10) {
        seconds = '0' + seconds;
    }
    return `${minutes}:${seconds}`;
}