import { EventHandler } from "./listen.js";

class Settings extends EventHandler {
    constructor() {
        super("BACKGROUND.SETTINGS");
        const self = this;
        this.appearance = {
            updatePositionBottomLeft() {
                self.emit({
                    event: "UPDATE.APPEARANCE.POSITION",
                    payload: "bottom-left",
                });
            },
            updatePositionBottomRight() {
                self.emit({
                    event: "UPDATE.APPEARANCE.POSITION",
                    payload: "bottom-right",
                });
            },
        };
    }
    getState() {
        return this.request("FETCH");
    }
    reset() {
        this.emit({ event: "RESET" });
    }
}

export default new Settings();
