import alias from "@rollup/plugin-alias";
import commonjs from "@rollup/plugin-commonjs";
import copy from "rollup-plugin-copy";
import { emptyDir } from "fs-extra";
import eslint from "@rollup/plugin-eslint";
import path from "path";
import { preprocessConfig } from "@kwangure/strawberry/config/index.cjs";
import replace from "@rollup/plugin-replace";
import resolve from "@rollup/plugin-node-resolve";
import sveltePreprocess from "svelte-preprocess";
import { terser } from "rollup-plugin-terser";

export const MODE = process.env.ROLLUP_WATCH ? "development" : "production";
export const PRODUCTION = MODE === "production";
export const DEV = MODE === "development";

export const OUT_DIR = DEV ? path.resolve("dev") : path.resolve("build");
export const BACKGROUND_DIR = "background";
export const BACKGROUND_OUT = `${OUT_DIR}/${BACKGROUND_DIR}`;
export const CONTENT_DIR = "content";
export const CONTENT_OUT = `${OUT_DIR}/${CONTENT_DIR}`;
export const OPTIONS_DIR = "options";
export const OPTIONS_OUT = `${OUT_DIR}/${OPTIONS_DIR}`;
export const POPUP_DIR = "popup";
export const POPUP_OUT = `${OUT_DIR}/${POPUP_DIR}`;
export const NEWTAB_DIR = "newtab";
export const NEWTAB_OUT = `${OUT_DIR}/${NEWTAB_DIR}`;
export const IMAGES_DIR = "images";
export const JS_ENTRY_OUT = "bundle.js";
export const WATCH_ENTRY_OUT = "watch.js";
export const CSS_OUT = "bundle.css";

export const strawberryPreprocess = sveltePreprocess(preprocessConfig);

export default {
    plugins: [
        {
            name: "empty-dir",
            renderStart: async ({ dir }) => {
                if (dir) await emptyDir(dir);
            },
        },
        replace({
            "import.meta.env.MODE": `"${MODE}"`,
            "import.meta.env.DEV": String(DEV),
            "import.meta.env.PROD": String(PRODUCTION),
            "process.env.NODE_ENV": `"${MODE}"`,
            "__SCRIPT__": JS_ENTRY_OUT,
        }),
        eslint({
            fix: PRODUCTION,
        }),
        resolve({
            browser: true,
            dedupe: (importee) => importee === "svelte" || importee.startsWith("svelte/"),
            preferBuiltins: true,
        }),
        // TODO: Only minify in Production
        /*
            Minification in dev works around a @popper/core bug used in @kwangure/strawberry.
            @popper/core compiled into es5, where a variable `var top = "top"` is being overwritten
            by Window.top, I assume due to how content scripts are imported in extensions.

            This renames to `var x= "top"`;

            I've not done further investigation/repro to confirm.
        */
        terser(),
        commonjs(),
        alias({
            entries: [
                {
                    find: "~@phase_ui",
                    replacement: path.resolve(__dirname, "./src/common/phase_ui"),
                },
                { find: "~@common", replacement: path.resolve(__dirname, "./src/common/") },
                { find: "~@content", replacement: path.resolve(__dirname, "./src/content/") },
                { find: "~@popup", replacement: path.resolve(__dirname, "./src/popup/") },
                { find: "~@utils", replacement: path.resolve(__dirname, "./src/utils/") },
                { find: "~@static", replacement: path.resolve(__dirname, "./static/") },
            ],
        }),
    ],
    onwarn: (warning, warn) => {
        const unusedCSSWarning
            = warning.pluginCode === "css-unused-selector"
            && (/[/\\]strawberry[/\\]/).test(warning.filename);

        if (unusedCSSWarning) {
            return;
        }
        warn(warning);
    },
};

export function copyHTMLPlugin({ script = JS_ENTRY_OUT, title = "Lisa", dir }) {
    return copy({
        targets: [{
            src: "static/index.html",
            dest: dir,
            transform: (contents) => {
                contents = contents.toString().replace("__SCRIPT__", script);
                contents = contents.replace("__TITLE__", title);
                return contents;
            },
        }],
        hook: "generateBundle",
    });
}
