import path from "path";
import { svelte } from "@sveltejs/vite-plugin-svelte";

function resolve(pathname) {
    return path.resolve(__dirname, pathname);
}

export default function config({ mode }) {
    const DEV = mode === "development";
    const PRODUCTION = mode === "production";
    const outDir = path.resolve(DEV ? "dev" : "build");

    return {
        resolve: {
            alias: {
                "~@common": resolve("./src/common/"),
                "~@content": resolve("./src/content/"),
                "~@popup": resolve("./src/popup/"),
                "~@utils": resolve("./src/utils/"),
                "~@static": resolve("./static/"),
            },
        },
        plugins: [
            svelte({
                emitCss: PRODUCTION,
                compilerOptions: {
                    dev: DEV,
                },
            }),
        ],
        build: {
            minify: PRODUCTION && "esbuild",
            rollupOptions: {
                input: {
                    "service_worker": resolve("./src/background/service_worker.js"),
                    "dashboard/index": resolve("./src/dashboard/index.html"),
                    "content/index": resolve("./src/content/index.js"),
                    "newtab/index": resolve("./src/newtab/index.js"),
                    "options/index": resolve("./src/options/index.html"),
                    "popup/index": resolve("./src/popup/index.html"),
                },
                output: {
                    // TODO: Once possible, duplicate chunks & avoid codesplitting
                    // Follow https://github.com/rollup/rollup/issues/2756
                    assetFileNames: "assets/[name][extname]",
                    entryFileNames: "[name].js",
                },
                treeshake: PRODUCTION,
            },
            outDir,
            sourceMaps: DEV ? "inline" : false,
            brotliSize: false,
        },
        publicDir: "static",
    };
}
