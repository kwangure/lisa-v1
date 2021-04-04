import common, {
    copyHTMLPlugin,
    CSS_OUT, DEV,
    JS_ENTRY_OUT,
    OPTIONS_OUT,
    strawberryPreprocess,
} from "./common.js";
import postcss from "rollup-plugin-postcss";
import svelte from "rollup-plugin-svelte";
import url from "@rollup/plugin-url";

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
            preprocess: strawberryPreprocess,
            emitCss: true,
            compilerOptions: {
                dev: DEV,
            },
        }),
        postcss({
            extract: CSS_OUT,
        }),
        copyHTMLPlugin({
            dir: OPTIONS_OUT,
            title: "Lisa Options",
            script: JS_ENTRY_OUT,
        }),
        url(),
    ],
    watch: {
        clearScreen: false,
    },
    preserveEntrySignatures: false,
    onwarn: common.onwarn,
};
