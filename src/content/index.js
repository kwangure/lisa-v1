import { timer } from "../common/events";
import "@webcomponents/custom-elements";
import Countdown from "./timer.wc.svelte";
import "@deimimi/strawberry/css/shared.css";

const app = new Countdown({
    target: document.body,
});
timer.on("DESTROY", function () {
    app.$destroy();
    timer.removeListeners();
});