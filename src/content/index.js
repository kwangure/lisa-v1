import "@webcomponents/custom-elements";
import Countdown from "./timer.wc.svelte";
import "@deimimi/strawberry/css/shared.css";

new Countdown({
    target: document.body,
});