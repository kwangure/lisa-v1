import { createConfig } from "./common.js";

export default createConfig({
    input: [
        "src/background/service_worker.js",
        "src/background/background.js",
    ],
    // TODO: Move from "" to "background" folder once Chrome 93 is stable
    // See https://stackoverflow.com/a/66115801
    output: "",
});
