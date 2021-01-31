export function escapeRegExp(string) {
    return string.replace(/[.*+\-?^${}()|[\]\\]/gu, "\\$&"); // $& means the whole matched string
}
