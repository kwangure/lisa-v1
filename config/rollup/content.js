import { preprocessConfig } from "@deimimi/strawberry/config";
import common, { CONTENT_OUT, CONTENT_DIR, CSS_OUT, DEV, JS_ENTRY_OUT } from "./common.js";
import postcss from "rollup-plugin-postcss";
import replace from "@rollup/plugin-replace";
import svelte from "rollup-plugin-svelte";

const WEB_COMPONET_POSTFIX = "wc.svelte";

export default {
    input: "src/content/index.js",
    output: {
        dir: CONTENT_OUT,
        entryFileNames: JS_ENTRY_OUT,
        format: "esm",
        sourcemap: "inline",
    },
    plugins: [
        ...common.plugins,
        replace({
            "__CONTENT_CSS__": `${CONTENT_DIR}/${CSS_OUT}`,
        }),
        svelte({
            dev: DEV,
            preprocess: preprocessConfig,
            exclude: `**/*.${WEB_COMPONET_POSTFIX}`,
            emitCss: true,
        }),
        svelte({
            dev: DEV,
            customElement: true,
            include: `**/*.${WEB_COMPONET_POSTFIX}`,
        }),
        postcss({
            extract: `${CSS_OUT}`,
        }),
    ],
};