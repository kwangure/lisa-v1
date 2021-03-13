import { preprocessConfig } from "@kwangure/strawberry/config";
import common, { copyHTMLPlugin, CSS_OUT, DEV, JS_ENTRY_OUT, POPUP_OUT } from "./common.js";
import postcss from "rollup-plugin-postcss";
import svelte from "rollup-plugin-svelte";

export default {
    input: "src/phase_ui/popup/index.js",
    output: {
        dir: POPUP_OUT,
        entryFileNames: JS_ENTRY_OUT,
        format: "esm",
        sourcemap: "inline",
    },
    plugins: [
        ...common.plugins,
        svelte({
            preprocess: preprocessConfig,
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
