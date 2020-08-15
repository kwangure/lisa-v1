import settingsWritable from "./settings.js";
import { createPomodoroMachine, createPomodoroService} from "./pomodoro/pomodoro.js";

const pomodoroMachine = createPomodoroMachine();
const settings = settingsWritable.value();
pomodoroMachine.withContext({ settings });

const pomodoroService = createPomodoroService(pomodoroMachine);
pomodoroService.onTransition((state) => {
    console.log("transitioning", { state });
});
pomodoroService.start();