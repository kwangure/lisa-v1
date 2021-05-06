import common, { BACKGROUND_OUT, JS_ENTRY_OUT } from "./common.js";

export default {
    input: "src/background/index.js",
    output: {
        dir: BACKGROUND_OUT,
        format: "esm",
        entryFileNames: JS_ENTRY_OUT,
        sourcemap: "inline",
    },
    plugins: [
        ...common.plugins.filter((p) => p.name !== "empty-dir"),
    ],
    watch: {
        clearScreen: false,
    },
};