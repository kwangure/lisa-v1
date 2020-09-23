/* global process */
import { eslint } from "rollup-plugin-eslint";
import { terser } from "rollup-plugin-terser";
import commonjs from "@rollup/plugin-commonjs";
import copy from "rollup-plugin-copy";
import path from "path";
import replace from "@rollup/plugin-replace";
import resolve from "@rollup/plugin-node-resolve";

export const MODE = process.env.ROLLUP_WATCH ? "development" : "production";
export const PRODUCTION = MODE === "production";
export const DEV = MODE === "development";

export const OUT_DIR = path.resolve("dist");
export const BACKGROUND_DIR = "background";
export const BACKGROUND_OUT = `${OUT_DIR}/${BACKGROUND_DIR}`;
export const CONTENT_DIR = "content";
export const CONTENT_OUT = `${OUT_DIR}/${CONTENT_DIR}`;
export const OPTIONS_DIR = "options";
export const OPTIONS_OUT = `${OUT_DIR}/${OPTIONS_DIR}`;
export const NEWTAB_DIR = "newtab";
export const NEWTAB_OUT = `${OUT_DIR}/${NEWTAB_DIR}`;
export const JS_ENTRY_OUT = "bundle.js";
export const CSS_OUT = "bundle.css";

export default {
    plugins: [
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
            dedupe: importee => importee === "svelte" || importee.startsWith("svelte/"),
            preferBuiltins: true,
        }),
        PRODUCTION && terser(),
        commonjs(),
    ],
};

export function copyHTMLPlugin({ script = JS_ENTRY_OUT, title = "Lisa", dir } ) {
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
    });
}