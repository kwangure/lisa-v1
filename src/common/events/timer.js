import { EventHandler } from "./listen.js";
import { timerPositions } from "../settings";

class Timer extends EventHandler {
    constructor() {
        super("BACKGROUND.TIMER");
    }
    destroy() {
        this.emit({ event: "DESTROY" });
    }
    disable(duration) {
        this.emit({ event: "DISABLE", payload: duration });
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
