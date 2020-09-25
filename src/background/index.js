import { emit, EventListener } from "../common/events";
import { createPomodoroMachine, createPomodoroService } from "./pomodoro/pomodoro.js";
import settingsWritable from "./settings.js";

const pomodoroMachine = createPomodoroMachine();
// TODO(kwangure): remember to `settingsWritable.cleanUp();` somewhere
const settings = settingsWritable.value();
pomodoroMachine.withContext({ settings });

const pomodoroService = createPomodoroService(pomodoroMachine);
pomodoroService.onTransition((state) => {
    emit({
        event: state.event.type,
        data: state,
        namespace: "BACKGROUND.TIMER",
    });
});
const timerEventsListener = new EventListener("BACKGROUND.TIMER");
timerEventsListener.all((event, data) => {
    pomodoroService.send(event, { value: data });
});
timerEventsListener.on("IS_INITIALIZED", (_, respond) => {
    respond(pomodoroService.initialized);
});
timerEventsListener.on("FETCH", (_, respond) => {
    respond(pomodoroService.state);
});
timerEventsListener.on("START", () => {
    console.log("heard start");
    pomodoroService.start();
});

const settingsEventsListener = new EventListener("BACKGROUND.SETTINGS");
settingsEventsListener.on("FETCH", (_, respond) => {
    respond(settingsWritable.value());
});
settingsEventsListener.on("UPDATE", (data) => {
    settingsWritable.set(data);
    emit({ namespace: "BACKGROUND.SETTINGS", event: "CHANGED", data });
});