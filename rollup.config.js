import {
    assets, background, content, options, popup, watch,
} from "./config/rollup/index.js";

export default [
    // Array order matters
    assets,
    watch,
    background,
    content,
    options,
    popup,
];
