import { createLocalStorageWritable } from "./store.js";
import { defaultSettings } from "../common/store/settings";

const writable = createLocalStorageWritable("settings");

export default writable(defaultSettings);
