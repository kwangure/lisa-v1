import { createConfig } from "./common.js";

export default createConfig({
    input: "src/options/index.js",
    output: "new_tab",
    plugins: [
        "svelte",
        "postcss",
    ],
});

