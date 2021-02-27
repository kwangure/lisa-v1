import { EventHandler } from "./listen.js";
import { timerPositions } from "../store/settings/default";

class Timer extends EventHandler {
    constructor() {
        super("BACKGROUND.TIMER");
    }
    destroy() {
        this.emit({ event: "DESTROY" });
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
    ignorePositionUpdate() {
        this.emit({ event: "POSITION.UPDATE.IGNORE" });
    }
    ignoreUpdate() {
        this.emit({ event: "DURATION.UPDATE.IGNORE" });
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
    positionLeft() {
        this.emit({
            event: "POSITION.UPDATE.FORCE_SAVE",
            payload: {
                position: timerPositions.BOTTOM_LEFT.value,
            },
        });
    }
    positionRight() {
        this.emit({
            event: "POSITION.UPDATE.FORCE_SAVE",
            namespace: "BACKGROUND.TIMER",
            payload: {
                position: timerPositions.BOTTOM_RIGHT.value,
            },
        });
    }
    reset() {
        this.emit({ event: "RESET" });
    }
    restart() {
        this.emit({ event: "RESTART" });
    }
    savePositionUpdate() {
        this.emit({ event: "POSITION.UPDATE.SAVE" });
    }
    saveUpdate() {
        this.emit({ event: "DURATION.UPDATE.SAVE" });
    }
    start() {
        return this.request("START");
    }
}

export default new Timer();
