import { createConfig } from "./common.js";

export default createConfig({
    input: "src/dashboard/index.js",
    output: "dashboard",
    plugins: [
        // Order matters. Empty directory first, then write to it.
        "empty",
        "copyIndexHTML",
        "svelte",
        "postcss",
        "url",
    ],
});
