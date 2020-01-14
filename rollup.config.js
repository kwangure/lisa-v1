import { terser } from 'rollup-plugin-terser'
import builtins from 'rollup-plugin-node-builtins'
import cssImport from "postcss-import";
import commonjs from 'rollup-plugin-commonjs'
import globals from 'rollup-plugin-node-globals'
import resolve from 'rollup-plugin-node-resolve'
import svelte from 'rollup-plugin-svelte'
import sveltePreprocess from "svelte-preprocess";

const production = !process.env.ROLLUP_WATCH

export default [
	{
		input: `src/newtab/main.js`,
		output: {
			file: `package/js/newtab.js`,
			format: 'iife',
			sourcemap: true,
		},
		plugins: [
			svelte({
				// enable run-time checks when not in production
				dev: !production,
				css: css => {
					css.write(`package/css/newtab.css`)
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
				dedupe: importee => importee === 'svelte' || importee.startsWith('svelte/'),
				preferBuiltins: true
			}),
			commonjs(),
			globals(),
			builtins(),
			// If we're building for production (npm run build
			// instead of npm run dev), minify
			production && terser()
		],
		onwarn: function (message, warn) {
			if (message.code === 'CIRCULAR_DEPENDENCY') {
				return
			}
			if (message.pluginCode === "missing-custom-element-compile-options"){
				return;
			}
			warn(message)
		}
	},
	{
		input: `src/background/main.js`,
		output: {
			file: `package/js/background.js`,
			format: 'iife',
			sourcemap: true,
		},
		plugins: [
			// If you have external dependencies installed from
			// npm, you'll most likely need these plugins. In
			// some cases you'll need additional configuration —
			// consult the documentation for details:
			// https://github.com/rollup/rollup-plugin-commonjs
			resolve({
				browser: true,
				preferBuiltins: true
			}),
			commonjs(),
			globals(),
			builtins(),
			// If we're building for production (npm run build
			// instead of npm run dev), minify
			production && terser()
		],
		onwarn: function (message, warn) {
			if (message.code === 'CIRCULAR_DEPENDENCY') {
				return
			}
			warn(message)
		}
	},
	{
		input: `src/options/main.js`,
		output: {
			file: `package/js/options.js`,
			format: 'iife',
			sourcemap: true,
		},
		plugins: [
			svelte({
				// enable run-time checks when not in production
				dev: !production,
				css: css => {
					css.write(`package/css/options.css`)
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
				dedupe: importee => importee === 'svelte' || importee.startsWith('svelte/'),
				preferBuiltins: true 
			}),
			commonjs(),
			globals(),
			builtins(),
			// If we're building for production (npm run build
			// instead of npm run dev), minify
			production && terser(),
		],
		onwarn: function (message, warn) {
			if (message.pluginCode === "missing-custom-element-compile-options"){
				return;
			}
			warn(message)
		}
	},
	{
		input: `src/content/main.js`,
		output: {
			file: `package/js/content.js`,
			format: 'iife',
			sourcemap: true,
		},
		plugins: [
			svelte({
				// enable run-time checks when not in production
				dev: !production,
				preprocess: sveltePreprocess({
					postcss: {
						plugins: [
							cssImport(),
						],
					},
				}),
				css: css => {
					css.write(`package/css/content.css`)
				},
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
				dedupe: importee => importee === 'svelte' || importee.startsWith('svelte/'),
				preferBuiltins: true 
			}),
			commonjs(),
			globals(),
			builtins(),
			// If we're building for production (npm run build
			// instead of npm run dev), minify
			production && terser()
		],
		onwarn: function (message, warn) {
			if (message.code === 'CIRCULAR_DEPENDENCY') {
				return
			}
			warn(message)
		}
	},
]