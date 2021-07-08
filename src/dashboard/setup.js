import { defaultSettings } from "~@common/settings";
import Storage from "./storage.js";

const settingsStorage = new Storage("lisa-settings", { defaultSettings });
const historyStorage = new Storage("lisa-history");

export default Promise.all([
    settingsStorage.onready(),
    historyStorage.onready(),
]);
