import common, { OUT_DIR } from "./common.js";

export default {
    input: [
        "src/background/service_worker.js",
        "src/background/background.js",
    ],
    output: {
        // TODO: Move to background folder once Chrome 93 is stable
        // See https://stackoverflow.com/a/66115801
        dir: OUT_DIR,
        format: "esm",
        sourcemap: "inline",
    },
    plugins: [
        ...common.plugins.filter((p) => p.name !== "empty-dir"),
    ],
    watch: {
        clearScreen: false,
    },
};
