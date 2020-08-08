import { preprocessConfig } from "@deimimi/strawberry/config";
import common, { CSS_OUT, DEV, JS_OUT, OUT_DIR } from "./common.js";
import path from "path";
import svelte from "rollup-plugin-svelte";

const WEB_COMPONET_POSTFIX = "wc.svelte";

export default {
    input: "src/content/index.js",
    output: {
        dir: OUT_DIR,
        format: "esm",
        entryFileNames: `${JS_OUT}/content.js`,
        chunkFileNames: `${JS_OUT}/[name].[hash].js`,
        sourcemap: "inline",
    },
    plugins: [
        ...common.plugins,
        svelte({
            dev: DEV,
            preprocess: preprocessConfig,
            exclude: `**/*.${WEB_COMPONET_POSTFIX}`,
            emitCss: true,
            css: css => {
                css.write(path.join(OUT_DIR, CSS_OUT, "content.css"), true);
            },
        }),
        svelte({
            dev: DEV,
            customElement: true,
            include: `**/*.${WEB_COMPONET_POSTFIX}`,
        }),
    ],
};