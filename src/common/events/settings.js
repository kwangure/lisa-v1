import { EventHandler } from "./listen.js";

class Settings extends EventHandler {
    constructor() {
        super("BACKGROUND.SETTINGS");
    }
    getState() {
        return this.request("FETCH");
    }
    reset() {
        this.emit({ event: "RESET" });
    }
    update(settings) {
        this.emit({ event: "UPDATE", payload: settings });
    }
}

export default new Settings();
