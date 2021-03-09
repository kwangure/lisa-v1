import { target, watch } from "proxy-watcher";
import { defaultSettings } from "../common/store/settings/default";

const initialSettings = JSON.parse(localStorage.getItem("settings"));
const settings = initialSettings || defaultSettings;

const [proxy, disable] = watch(settings, () => {
    const settings = JSON.stringify(target(proxy));
    localStorage.setItem("settings", settings);
});

export default proxy;
export { disable as close };
