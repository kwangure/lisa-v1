import { preprocessConfig } from "@kwangure/strawberry/config";
import common, { CSS_OUT, DEV, JS_ENTRY_OUT, OPTIONS_OUT, copyHTMLPlugin } from "./common.js";
import postcss from "rollup-plugin-postcss";
import svelte from "rollup-plugin-svelte";

export default {
    input: "src/options/index.js",
    output: {
        dir: OPTIONS_OUT,
        entryFileNames: JS_ENTRY_OUT,
        format: "esm",
        sourcemap: "inline",
    },
    plugins: [
        ...common.plugins,
        svelte({
            dev: DEV,
            preprocess: preprocessConfig,
            emitCss: true,
        }),
        postcss({
            extract: CSS_OUT,
        }),
        copyHTMLPlugin({
            dir: OPTIONS_OUT,
            title: "Lisa Options",
            script: JS_ENTRY_OUT,
        }),
    ],
    watch: {
        clearScreen: false,
    },
    preserveEntrySignatures: false,
    onwarn: common.onwarn,
};