import common, { JS_OUT, OUT_DIR } from "./common.js";

export default {
    input: "src/background/index.js",
    output: {
        dir: OUT_DIR,
        format: "esm",
        entryFileNames: `${JS_OUT}/background.js`,
        chunkFileNames: `${JS_OUT}/[name].[hash].js`,
        sourcemap: "inline",
    },
    plugins: [
        ...common.plugins,
    ],
    watch: {
        clearScreen: false,
    },
};