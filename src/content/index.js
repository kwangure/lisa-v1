import "@webcomponents/custom-elements";
import "@kwangure/strawberry/css/customElement";
import Countdown from "./timer.wc.svelte";

new Countdown({
    target: document.body,
});
