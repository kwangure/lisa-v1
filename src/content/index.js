import "@webcomponents/custom-elements";
import "@deimimi/strawberry/css/customElement";
import Countdown from "./timer.wc.svelte";

new Countdown({
    target: document.body,
});
