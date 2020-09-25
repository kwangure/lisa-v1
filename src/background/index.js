import { emit, timer, settings } from "../common/events";
import { createPomodoroMachine, createPomodoroService } from "./pomodoro/pomodoro.js";
import settingsWritable from "./settings.js";

const pomodoroMachine = createPomodoroMachine();
// TODO(kwangure): remember to `settingsWritable.cleanUp();` somewhere
pomodoroMachine.withContext({
    settings: settingsWritable.value(),
});

const pomodoroService = createPomodoroService(pomodoroMachine);
pomodoroService.onTransition((state) => {
    emit({
        event: state.event.type,
        data: state,
        namespace: "BACKGROUND.TIMER",
    });
});
timer.all((event, data) => {
    pomodoroService.send(event, { value: data });
});
timer.on("IS_INITIALIZED", (_, respond) => {
    respond(pomodoroService.initialized);
});
timer.on("FETCH", (_, respond) => {
    respond(pomodoroService.state);
});
timer.on("START", () => {
    console.log("heard start");
    pomodoroService.start();
});

settings.on("FETCH", (_, respond) => {
    respond(settingsWritable.value());
});
settings.on("UPDATE", (data) => {
    settingsWritable.set(data);
    emit({ namespace: "BACKGROUND.SETTINGS", event: "CHANGED", data });
});