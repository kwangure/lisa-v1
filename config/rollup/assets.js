import {
    BACKGROUND_DIR,
    CONTENT_DIR,
    OPTIONS_DIR,
    OUT_DIR,
    JS_ENTRY_OUT,
    WATCH_ENTRY_OUT,
} from "./common.js";
import copy from "rollup-plugin-copy";

export default {
    input: "static/dummy.js",
    output: {
        dir: OUT_DIR,
    },
    plugins: [
        copy({
            targets: [
                {
                    src: ["static/**/*", "!static/index.html", "!static/audio/**"],
                    dest: OUT_DIR,
                    transform: contents => {
                        contents = contents.toString();
                        contents = contents.replace("__OPTIONS_PAGE__", `${OPTIONS_DIR}/index.html`);
                        contents = contents.replace("__BACKGROUND_JS__", `${BACKGROUND_DIR}/${JS_ENTRY_OUT}`);
                        contents = contents.replace("__RELOAD_JS__", `${BACKGROUND_DIR}/${WATCH_ENTRY_OUT}`);
                        contents = contents.replace("__CONTENT_JS__", `${CONTENT_DIR}/${JS_ENTRY_OUT}`);
                        return contents;
                    },
                },
                {
                    src: "static/audio/*",
                    dest: `${OUT_DIR}/audio`,
                },
            ],
        }),
    ],
};