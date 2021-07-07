import alias from "@rollup/plugin-alias";
import commonjs from "@rollup/plugin-commonjs";
import copy from "../../scripts/rollup-plugin-copy-watch.js";
import { emptyDir } from "fs-extra";
import path from "path";
import postcss from "rollup-plugin-postcss";
import replace from "@rollup/plugin-replace";
import resolve from "@rollup/plugin-node-resolve";
import svelte from "rollup-plugin-svelte";
import { terser } from "rollup-plugin-terser";
import url from "@rollup/plugin-url";

export const MODE = process.env.ROLLUP_WATCH ? "development" : "production";
export const PRODUCTION = MODE === "production";
export const DEV = MODE === "development";

export const OUT_DIR = DEV ? path.resolve("dev") : path.resolve("build");
export const CSS_OUT = "bundle.css";

const commonPlugins = [
    replace({
        "import.meta.env.MODE": `"${MODE}"`,
        "import.meta.env.DEV": String(DEV),
        "import.meta.env.PROD": String(PRODUCTION),
        "process.env.NODE_ENV": `"${MODE}"`,
    }),
    resolve({
        browser: true,
        dedupe: (importee) => importee === "svelte" || importee.startsWith("svelte/"),
        preferBuiltins: true,
    }),
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
];

const sharedPlugins = {
    copyIndexHTML: copy({
        targets: [{
            src: "static/index.html",
            verbose: true,
        }],
        watch: ["static"],
    }),
    empty: {
        name: "empty-dir",
        renderStart: async ({ dir }) => {
            if (dir) await emptyDir(dir);
        },
    },
    svelte: svelte({
        preprocess: strawberryPreprocess,
        exclude: "**/*.wc.svelte",
        emitCss: true,
        compilerOptions: {
            dev: DEV,
        },
    }),
    svelteWC: svelte({
        include: "**/*.wc.svelte",
        compilerOptions: {
            customElement: true,
            dev: DEV,
        },
    }),
    postcss: postcss({
        extract: true,
    }),
    terser: terser(),
    url: url(),
};

export function createConfig({
    input,
    output,
    plugins = [],
}) {

    plugins = plugins.map((p) => {
        const plugin = sharedPlugins[p];

        if (!plugin) {
            throw Error(`No plugin called "${p}" exists.`);
        }

        return plugin;
    });

    return {
        input: input,
        output: {
            dir: path.join(OUT_DIR, output),
            format: "esm",
            sourcemap: "inline",
        },
        plugins: [
            ...plugins,
            ...commonPlugins,
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
        preserveEntrySignatures: false,
        watch: {
            clearScreen: false,
        },
    };
}
