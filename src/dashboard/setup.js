import clone from "just-clone";
import { defaultSettings } from "~@common/settings";
import storageWritable from "./storage.js";

export const settings = storageWritable("lisa-settings", clone(defaultSettings));
export const history = storageWritable("lisa-history");
