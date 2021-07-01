import copy from "../../scripts/rollup-plugin-copy-watch.js";
import { OUT_DIR } from "./common.js";

export default {
    input: "static/dummy.js",
    output: {
        dir: OUT_DIR,
    },
    plugins: [
        copy({
            targets: [
                { src: "static/manifest.json", dest: OUT_DIR },
                { src: "static/audio/*", dest: `${OUT_DIR}/audio` },
                { src: "static/images/*", dest: `${OUT_DIR}/images` },
            ],
            watch: ["static"],
        }),
    ],
};
