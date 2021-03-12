import {
    BACKGROUND_DIR,
    CONTENT_DIR,
    IMAGES_DIR,
    JS_ENTRY_OUT,
    OPTIONS_DIR,
    OUT_DIR,
    POPUP_DIR,
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
            targets: [{
                src: ["static/**/*", "!static/index.html", "!static/images/**", "!static/audio/**"],
                dest: OUT_DIR,
                transform: (contents) => {
                    contents = contents.toString();
                    contents = contents.replace("__OPTIONS_PAGE__", `${OPTIONS_DIR}/index.html`);
                    contents = contents.replace("__POPUP_PAGE__", `${POPUP_DIR}/index.html`);
                    contents = contents.replace("__BACKGROUND_JS__", `${BACKGROUND_DIR}/${JS_ENTRY_OUT}`);
                    contents = contents.replace("__RELOAD_JS__", `${BACKGROUND_DIR}/${WATCH_ENTRY_OUT}`);
                    contents = contents.replace("__CONTENT_JS__", `${CONTENT_DIR}/${JS_ENTRY_OUT}`);
                    contents = contents.replace(/__BROWSER_ACTION__/g, `${IMAGES_DIR}/browser-action.png`);
                    return contents;
                },
            },
            {
                src: "static/audio/*",
                dest: `${OUT_DIR}/audio`,
            },
            {
                src: "static/images/*",
                dest: `${OUT_DIR}/${IMAGES_DIR}`,
            }],
        }),
    ],
};
