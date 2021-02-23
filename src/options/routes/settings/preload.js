import { createSettingsWritable } from "../../../common/store/settings";

export default async function preload() {
    return { settingStore: await createSettingsWritable() };
}
