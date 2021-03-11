const config = require("@kwangure/eslint-config-svelte");

config.globals = {
    ...config.globals,
    chrome: false,
};

config.rules["max-len"] = ["error", {
    code: 100, // xState objects are painful without this
    ignoreComments: true,
}];


module.exports = config;
