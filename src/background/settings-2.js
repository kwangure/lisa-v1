import { defaultSettings } from "../common/store/settings";

export function getSettings() {
    return JSON.parse(localStorage.getItem("settings")) || defaultSettings;
}

export function getPhaseSettings(phase) {
    const { phaseSettings } = getSettings();

    return phase
        ? phaseSettings[phase]
        : phaseSettings;
}

export function getAppearanceSettings() {
    const { appearanceSettings } = getSettings();

    return appearanceSettings;
}

export function updateSettings(newSettings) {
    localStorage.setItem("settings", JSON.stringify(newSettings));
}

export function updateAppearanceSettings(appearanceSettings) {
    const settings = getSettings();
    settings.appearanceSettings = appearanceSettings;
    updateSettings(settings);
}
