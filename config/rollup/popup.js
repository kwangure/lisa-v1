import common, {
    copyHTMLPlugin,
    CSS_OUT,
    DEV,
    JS_ENTRY_OUT,
    POPUP_OUT,
    strawberryPreprocess,
} from "./common.js";
import postcss from "rollup-plugin-postcss";
import svelte from "rollup-plugin-svelte";

export default {
    input: "src/popup/index.js",
    output: {
        dir: POPUP_OUT,
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
            dir: POPUP_OUT,
            title: "Lisa Popup",
            script: JS_ENTRY_OUT,
        }),
    ],
    watch: {
        clearScreen: false,
    },
    preserveEntrySignatures: false,
    onwarn: common.onwarn,
};
