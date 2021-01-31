import { preprocessConfig } from "@kwangure/strawberry/config";
import common, { CSS_OUT, DEV, JS_OUT, OUT_DIR } from "./common.js";
import postcss from "rollup-plugin-postcss";
import svelte from "rollup-plugin-svelte";

const WEB_COMPONET_POSTFIX = "wc.svelte";

export default {
    input: "src/newtab/index.js",
    output: {
        dir: OUT_DIR,
        format: "esm",
        entryFileNames: `${JS_OUT}/new_tab.js`,
        chunkFileNames: `${JS_OUT}/[name].[hash].js`,
        sourcemap: "inline",
    },
    plugins: [
        ...common.plugins,
        svelte({
            preprocess: preprocessConfig,
            exclude: `**/*.${WEB_COMPONET_POSTFIX}`,
            emitCss: true,
            compilerOptions: {
                dev: DEV,
            },
        }),
        svelte({
            include: `**/*.${WEB_COMPONET_POSTFIX}`,
            compilerOptions: {
                customElement: true,
                dev: DEV,
            },
        }),
        postcss({
            extract: `${CSS_OUT}/new_tab.css`,
        }),
    ],
};