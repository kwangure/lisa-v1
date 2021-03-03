import { getSettings } from "../../../background/settings-2.js";

export default function preload() {
    return { settings: getSettings() };
}
