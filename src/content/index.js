import { timer } from "../common/events";
import "@webcomponents/custom-elements";
import Countdown, { preload } from "./timer.wc.svelte";
import "@deimimi/strawberry/css/shared.css";

(async function () {
    const app = new Countdown({
        target: document.body,
        props: await preload(),
    });
    timer.on("DESTROY", function () {
        app.$destroy();
        timer.removeListeners();
    });
})();
