import { emit, EventListener } from "../common/events";
import { createPomodoroMachine, createPomodoroService} from "./pomodoro/pomodoro.js";
import settingsWritable from "./settings.js";

const pomodoroMachine = createPomodoroMachine();
const settings = settingsWritable.value();
pomodoroMachine.withContext({ settings });

const pomodoroService = createPomodoroService(pomodoroMachine);
pomodoroService.onTransition((state) => {
    emit({
        event: state.event.type,
        data: state,
        namespace: "TIMER",
    });
});
pomodoroService.start();

const timerEventsListener = new EventListener("TIMER");
timerEventsListener.all((event, data) => {
    pomodoroService.send(event, { value: data });
});

const pomdoroEventsListener = new EventListener("BACKGROUND.TIMER");
pomdoroEventsListener.on("DATA", (_, respond) => {
    respond(pomodoroService.state);
});

const settingsEventsListener = new EventListener("BACKGROUND.SETTINGS");
settingsEventsListener.on("DATA", (_, respond) => {
    respond(settingsWritable.value());
});