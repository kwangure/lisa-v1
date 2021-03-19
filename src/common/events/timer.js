import { EventHandler } from "./listen.js";
import { timerPositions } from "../settings";

class Timer extends EventHandler {
    constructor() {
        super("BACKGROUND.TIMER");
    }
    destroy() {
        this.emit({ event: "DESTROY" });
    }
    disable() {
        this.emit({ event: "DISABLE" });
    }
    disableStart(duration) {
        this.emit({ event: "DISABLE.START", payload: duration });
    }
    disableEnd() {
        this.emit({ event: "DISABLE.END" });
    }
    disableCancel() {
        this.emit({ event: "DISABLE.CANCEL" });
    }
    dismissRemainingWarning() {
        this.emit({ event: "WARN_REMAINING.DISMISS" });
    }
    extendPrevious(duration) {
        this.emit({ event: "EXTEND", payload: duration });
    }
    getState() {
        return this.request("FETCH");
    }
    isInitialized() {
        return this.request("IS_INITIALIZED");
    }
    isRightPosition(position) {
        return timerPositions.BOTTOM_RIGHT.value === position;
    }
    nextPhase() {
        this.emit({ event: "NEXT" });
    }
    pause() {
        this.emit({ event: "PAUSE" });
    }
    pauseDefault() {
        this.emit({ event: "PAUSE.DEFAULT" });
    }
    play() {
        this.emit({ event: "PLAY" });
    }
    reset() {
        this.emit({ event: "RESET" });
    }
    restart() {
        this.emit({ event: "RESTART" });
    }
    start() {
        this.emit({ event: "START" });
    }
}

export default new Timer();
