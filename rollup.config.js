/* global process */
import { eslint } from "rollup-plugin-eslint";
import { terser } from "rollup-plugin-terser";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import svelte from "rollup-plugin-svelte";
import nodePolyfills from "rollup-plugin-node-polyfills";
import { customElementsPreprocess } from "@deimimi/strawberry/config";

const production = !process.env.ROLLUP_WATCH;

export default [
    {
        input: "src/newtab/main.js",
        output: {
            file: "package/js/newtab.js",
            format: "iife",
            sourcemap: "inline",
        },
        plugins: [
            eslint({
                fix: production,
            }),
            svelte({
                // enable run-time checks when not in production
                dev: !production,
                preprocess: customElementsPreprocess,
                css: css => {
                    css.write("package/css/newtab.css");
                },
                hydratable: true,
            }),
            // If you have external dependencies installed from
            // npm, you'll most likely need these plugins. In
            // some cases you'll need additional configuration —
            // consult the documentation for details:
            // https://github.com/rollup/rollup-plugin-commonjs
            resolve({
                browser: true,
                dedupe: importee => importee === "svelte" || importee.startsWith("svelte/"),
                preferBuiltins: true,
            }),
            commonjs(),
            nodePolyfills(),
            // If we're building for production (npm run build
            // instead of npm run dev), minify
            production && terser(),
        ],
        onwarn: function (message, warn) {
            if (message.code === "CIRCULAR_DEPENDENCY") {
                return;
            }
            if (message.pluginCode === "missing-custom-element-compile-options"){
                return;
            }
            warn(message);
        },
    },
    {
        input: "src/background/main.js",
        output: {
            file: "package/js/background.js",
            format: "iife",
            sourcemap: "inline",
        },
        plugins: [
            // If you have external dependencies installed from
            // npm, you'll most likely need these plugins. In
            // some cases you'll need additional configuration —
            // consult the documentation for details:
            // https://github.com/rollup/rollup-plugin-commonjs
            resolve({
                browser: true,
                preferBuiltins: true,
            }),
            eslint({
                fix: production,
            }),
            commonjs(),
            nodePolyfills(),
            // If we're building for production (npm run build
            // instead of npm run dev), minify
            production && terser(),
        ],
        onwarn: function (message, warn) {
            if (message.code === "CIRCULAR_DEPENDENCY") {
                return;
            }
            warn(message);
        },
    },
    {
        input: "src/options/main.js",
        output: {
            file: "package/js/options.js",
            format: "iife",
            sourcemap: "inline",
        },
        plugins: [
            eslint({
                fix: production,
            }),
            svelte({
                // enable run-time checks when not in production
                dev: !production,
                preprocess: customElementsPreprocess,
                css: css => {
                    css.write("package/css/options.css");
                },
                hydratable: true,
            }),
            // If you have external dependencies installed from
            // npm, you'll most likely need these plugins. In
            // some cases you'll need additional configuration —
            // consult the documentation for details:
            // https://github.com/rollup/rollup-plugin-commonjs
            resolve({
                browser: true,
                dedupe: importee => importee === "svelte" || importee.startsWith("svelte/"),
                preferBuiltins: true,
            }),
            commonjs(),
            nodePolyfills(),
            // If we're building for production (npm run build
            // instead of npm run dev), minify
            production && terser(),
        ],
        onwarn: function (message, warn) {
            if (message.pluginCode === "missing-custom-element-compile-options"){
                return;
            }
            warn(message);
        },
    },
    {
        input: "src/content/main.js",
        output: {
            file: "package/js/content.js",
            format: "iife",
            sourcemap: "inline",
        },
        plugins: [
            eslint({
                fix: production,
            }),
            svelte({
                // enable run-time checks when not in production
                dev: !production,
                preprocess: customElementsPreprocess,
                // Tell the compiler to output a custom element.
                customElement: true,
            }),
            // If you have external dependencies installed from
            // npm, you'll most likely need these plugins. In
            // some cases you'll need additional configuration —
            // consult the documentation for details:
            // https://github.com/rollup/rollup-plugin-commonjs
            resolve({
                browser: true,
                dedupe: importee => importee === "svelte" || importee.startsWith("svelte/"),
                preferBuiltins: true,
            }),
            commonjs(),
            nodePolyfills(),
            // If we're building for production (npm run build
            // instead of npm run dev), minify
            production && terser(),
        ],
        onwarn: function (message, warn) {
            if (message.code === "CIRCULAR_DEPENDENCY") {
                return;
            }
            warn(message);
        },
    },
];