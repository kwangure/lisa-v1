import { createConfig } from "./common.js";

export default createConfig({
    input: "src/popup/index.js",
    output: "popup",
    plugins: [
        "copyIndexHTML",
        "svelte",
        "postcss",
        "url",
    ],
});
