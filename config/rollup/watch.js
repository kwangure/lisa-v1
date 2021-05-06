import common, { BACKGROUND_OUT, WATCH_ENTRY_OUT } from "./common.js";

export default {
    input: "src/background/watch/index.js",
    output: {
        dir: BACKGROUND_OUT,
        format: "esm",
        entryFileNames: WATCH_ENTRY_OUT,
        sourcemap: "inline",
    },
    plugins: [
        ...common.plugins,
    ],
    watch: {
        clearScreen: false,
    },
};
