import { createConfig } from "./common.js";

export default createConfig({
    input: "src/content/index.js",
    output: "content",
    plugins: [
        "svelte",
        "svelteWC",
        "postcss",
        // TODO: Only minify in Production
        /*
            Minification in dev works around a @popper/core bug used in @kwangure/strawberry.
            @popper/core compiled into es5, where a variable `var top = "top"` is being overwritten
            by Window.top, I assume due to how content scripts are imported in extensions.

            This renames to `var x= "top"`;

            I've not done further investigation/repro to confirm.
        */
        "terser",
    ],
});
