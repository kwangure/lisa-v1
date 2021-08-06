import "@webcomponents/custom-elements";
import "@kwangure/strawberry/css/customElement";
import Countdown from "./timer.svelte";

class Lisa extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
        new Countdown({ target: this.shadowRoot });
    }
}

customElements.define("lisa-timer", Lisa);
const lisaTimer = document.createElement("lisa-timer");
document.body.appendChild(lisaTimer);
