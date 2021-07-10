import { createConfig } from "./common.js";

export default createConfig({
    input: "src/options/index.js",
    output: "options",
    plugins: [
        // Order matters. Empty directory first, then write to it.
        "empty",
        "copyIndexHTML",
        "svelte",
        "postcss",
        "url",
    ],
});
