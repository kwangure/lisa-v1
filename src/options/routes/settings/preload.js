import { getSettings } from "../../../background/settings.js";

export default function preload() {
    return { settings: getSettings() };
}
