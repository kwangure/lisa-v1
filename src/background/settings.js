import { defaultSettings } from "../common/store/settings.js";
import { createLocalStorageWritable } from "./store.js";

const writable = createLocalStorageWritable("settings");

export default writable(defaultSettings);