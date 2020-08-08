/* global process */
import { eslint } from "rollup-plugin-eslint";
import { terser } from "rollup-plugin-terser";
import commonjs from "@rollup/plugin-commonjs";
import copy from "rollup-plugin-copy";
import path from "path";
import postcss from "rollup-plugin-postcss";
import replace from "@rollup/plugin-replace";
import resolve from "@rollup/plugin-node-resolve";

export const MODE = process.env.ROLLUP_WATCH ? "development" : "production";
export const PRODUCTION = MODE === "production";
export const DEV = MODE === "development";

export const OUT_DIR = path.resolve("dist");
export const CSS_OUT = "css";
export const JS_OUT = "js";

export default {
    plugins: [
        replace({
            "import.meta.env.MODE": MODE,
            "import.meta.env.DEV": String(DEV),
            "import.meta.env.PROD": String(PRODUCTION),
        }),
        eslint({
            fix: PRODUCTION,
        }),
        resolve({
            browser: true,
            dedupe: importee => importee === "svelte" || importee.startsWith("svelte/"),
            preferBuiltins: true,
        }),
        postcss({
            extract: `${CSS_OUT}/common.css`,
        }),
        PRODUCTION && terser(),
        commonjs(),
        copy({
            targets: [
                { src: "static/*", dest: "dist" },
            ],
        }),
    ],
};